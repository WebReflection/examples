import * as struct from './struct.js';
import { text, fromCharCode } from './utils.js';

const { stringify } = JSON;
const { defineProperty } = Object;

class BaseMessage {
  static get ID() { return this.prototype.ID }
  static deserialize() { throw new Error('deserialize') }
  get ID() { throw new Error('ID') }
  serialize() { throw new Error('serialize') }
  toString() {
    return `${this.constructor.name} ${stringify(this, null, '  ')}`;
  }
}

export const StatusResponse = (name, id) => defineProperty(
  class BaseStatusResponse extends BaseMessage {
    static deserialize({ buffer }) {
      const [_, status] = struct.unpack("<BB", buffer);
      return new BaseStatusResponse(status == 0x00);
    }
    get ID() { return id }
    constructor(success) {
      super();
      this.success = success;
    }
  },
  'name',
  { value: name }
);

export class InfoRequest extends BaseMessage {
  get ID() { return 0x00 }
  serialize() {
    return new Uint8Array([0]);
  }
}

export class InfoResponse extends BaseMessage {
  static deserialize({ buffer }) {
    const [
      _,
      rpc_major,
      rpc_minor,
      rpc_build,
      firmware_major,
      firmware_minor,
      firmware_build,
      max_packet_size,
      max_message_size,
      max_chunk_size,
      product_group_device,
    ] = struct.unpack("<BBBHBBHHHHH", buffer);
    return new InfoResponse(
      rpc_major,
      rpc_minor,
      rpc_build,
      firmware_major,
      firmware_minor,
      firmware_build,
      max_packet_size,
      max_message_size,
      max_chunk_size,
      product_group_device,
    );
  }
  get ID() { return 0x01 }
  constructor(
    rpc_major,
    rpc_minor,
    rpc_build,
    firmware_major,
    firmware_minor,
    firmware_build,
    max_packet_size,
    max_message_size,
    max_chunk_size,
    product_group_device,
  ) {
    super();
    this.rpc_major = rpc_major;
    this.rpc_minor = rpc_minor;
    this.rpc_build = rpc_build;
    this.firmware_major = firmware_major;
    this.firmware_minor = firmware_minor;
    this.firmware_build = firmware_build;
    this.max_packet_size = max_packet_size;
    this.max_message_size = max_message_size;
    this.max_chunk_size = max_chunk_size;
    this.product_group_device = product_group_device;
  }
}

export class ClearSlotRequest extends BaseMessage {
  get ID() { return 0x46 }
  constructor(slot) {
    super();
    this.slot = slot;
  }
  serialize() {
    return struct.pack("<BB", this.ID, this.slot);
  }
}

export const ClearSlotResponse = StatusResponse("ClearSlotResponse", 0x47);

export class StartFileUploadRequest extends BaseMessage {
  get ID() { return 0x0C }
  constructor(file_name, slot, crc) {
    super();
    this.file_name = file_name;
    this.slot = slot;
    this.crc = crc;
  }
  serialize() {
    const encoded_name = text.encode(this.file_name);
    const { length } = encoded_name;
    if (length > 31) {
      throw new Error(
        `UTF-8 encoded file name too long: ${length} +1 >= 32`
      );
    }
    const fmt = `<B${length+1}sBI`;
    return struct.pack(fmt, this.ID, fromCharCode(...encoded_name), this.slot, this.crc);
  }
}

export const StartFileUploadResponse = StatusResponse("StartFileUploadResponse", 0x0D);

export class TransferChunkRequest extends BaseMessage {
  get ID() { return 0x10 }
  constructor(running_crc, chunk) {
    super();
    this.running_crc = running_crc;
    this.size = chunk.length;
    this.payload = chunk;
  }
  serialize() {
    const fmt = `<BIH${this.size}s`;
    return struct.pack(fmt, this.ID, this.running_crc, this.size, fromCharCode(...this.payload))
  }
}

export const TransferChunkResponse = StatusResponse("TransferChunkResponse", 0x11);

export class ProgramFlowRequest extends BaseMessage {
  get ID() { return 0x1E }
  constructor(stop, slot) {
    super();
    this.stop = stop;
    this.slot = slot;
  }
  serialize() {
    return struct.pack("<BBB", this.ID, this.stop, this.slot);
  }
}

export const ProgramFlowResponse = StatusResponse("ProgramFlowResponse", 0x1F);

export class ProgramFlowNotification extends BaseMessage {
  static deserialize({ buffer }) {
    const [_, stop] = struct.unpack("<BB", buffer);
    return new ProgramFlowNotification(Boolean(stop));
  }
  get ID() { return 0x20 }
  constructor(stop) {
    super();
    this.stop = stop;
  }
}

export class ConsoleNotification extends BaseMessage {
  static deserialize(data) {
    const messsage = text.decode(data.slice(1));
    return new ConsoleNotification(messsage.replace(/\x00+$/, ''));
  }
  get ID() { return 0x21 }
  constructor(text) {
    super();
    this.text = text;
  }
}

export class DeviceNotificationRequest extends BaseMessage {
  get ID() { return 0x28 }
  constructor(interval_ms) {
    super();
    this.interval_ms = interval_ms;
  }
  serialize() {
    return struct.pack("<BH", this.ID, this.interval_ms);
  }
}

export const DeviceNotificationResponse = StatusResponse("DeviceNotificationResponse", 0x29);

const DEVICE_MESSAGE_MAP = new Map([
  [0x00, ["Battery", "<BB"]],
  [0x01, ["IMU", "<BBBhhhhhhhhh"]],
  [0x02, ["5x5", "<B25B"]],
  [0x0A, ["Motor", "<BBBhhbi"]],
  [0x0B, ["Force", "<BBBB"]],
  [0x0C, ["Color", "<BBbHHH"]],
  [0x0D, ["Distance", "<BBh"]],
  [0x0E, ["3x3", "<BB9B"]],
]);

export class DeviceNotification extends BaseMessage {
  static deserialize(data) {
    const [_, size] = struct.unpack("<BH", data.slice(0, 3).buffer);
    if (data.length != (size + 3)) {
      console.warn(`Unexpected size: ${data.length} != ${size} + 3`);
    }
    return new DeviceNotification(size, data.slice(3));
  }
  #payload;
  get ID() { return 0x3C }
  get payload() { return this.#payload }
  constructor(size, payload) {
    super();
    this.#payload = payload;
    this.size = size;
    this.messages = [];
    let data = payload.slice();
    while (data.length) {
      const id = data[0];
      if (DEVICE_MESSAGE_MAP.has(id)) {
        const [name, fmt] = DEVICE_MESSAGE_MAP.get(id);
        const size = struct.calcsize(fmt);
        const values = struct.unpack(fmt, data.slice(0, size).buffer);
        this.messages.push([name, values]);
        data = data.slice(size);
      }
      else {
        console.warn(`Unknown message: ${id}`);
        break
      }
    }
  }
}

const KNOWN_MESSAGES = new Map([
  InfoRequest,
  InfoResponse,
  ClearSlotRequest,
  ClearSlotResponse,
  StartFileUploadRequest,
  StartFileUploadResponse,
  TransferChunkRequest,
  TransferChunkResponse,
  ProgramFlowRequest,
  ProgramFlowResponse,
  ProgramFlowNotification,
  ConsoleNotification,
  DeviceNotificationRequest,
  DeviceNotificationResponse,
  DeviceNotification,
].map(Class => [Class.ID, Class]));

export const deserialize = data => {
  const [message_type] = data;
  if (KNOWN_MESSAGES.has(message_type))
    return KNOWN_MESSAGES.get(message_type).deserialize(data);
  throw new Error(`Unknown message: ${text.decode(data)}`);
};

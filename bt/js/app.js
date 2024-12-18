import BT from './bt.js';
import * as cobs from './cobs.js';
import { text } from './utils.js';
import {
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
  deserialize,
} from './messages.js';
import { crc } from './crc.js';

const DEVICE_NOTIFICATION_INTERVAL_MS = 100;
const EXAMPLE_SLOT = 0;

const Future = () => Promise.withResolvers();

const bt = new BT;
const button = document.querySelector('#connect');
const content = document.querySelector('#content');
const show = document.querySelector('#show');

globalThis.prime = {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "matrix": []};

const show_on_matrix = async event => {
  const EXAMPLE_PROGRAM = text.encode(content.value.trim());
  show.disabled = true;

  let pending_response = [-1, Future()];
  let ending_response = null;

  bt.ondata = data => {
    if (data[data.length - 1] !== 0x02) {
      console.error('Received incomplete message');
      return;
    }
    data = cobs.unpack(data);
    try {
      const message = deserialize(data);
      if (message instanceof ConsoleNotification) {
        console.info(message.text);
        if (message.text === "\r\n") {
          ending_response = Future();
          ending_response.promise.then(() => { show.disabled = false });
        }
      }
      else {
        if (message.ID === pending_response[0])
          pending_response[1].resolve(message);
        if (message instanceof DeviceNotification) {
          const { messages } = message;
          messages.sort(([a], [b]) => a.localeCompare(b));
          // console.log(messages.map(([key, value]) => ` - ${key.padEnd(10)}: [${value.join(', ')}]`).join('\n'));
          for (const [key, values] of messages) {
            if (key === 'IMU') {
              const [yaw, pitch, roll] = values.slice(3, 6);
              prime["yaw"] = yaw / 10
              prime["pitch"] = pitch / 10
              prime["roll"] = roll / 10
            }
            else if (key === '5x5') {
              prime.matrix = values;
              const rows = document.querySelectorAll("#matrix tr");
              let x = 0, y = 0;
              for (const value of values.slice(1)) {
                rows[y].children[x++].textContent = value < 50 ? " " : "🟩";
                if (x === 5) {
                  x = 0;
                  y++;
                }
              }
            }
          }
        }
        else if (ending_response != null && message instanceof ProgramFlowNotification)
          ending_response.resolve();
      }
    }
    catch ({ message }) {
      console.error(message);
    }
  };

  let info_response = null;
  const send_message = async message => {
    const payload = message.serialize();
    const frame = cobs.pack(new Uint8Array(payload));
    const packet_size = info_response ? info_response.max_packet_size : frame.length;
    for (let i = 0; i < frame.length; i += packet_size) {
      const packet = frame.slice(i, i + packet_size);
      const size = packet.length;
      const ui8a = new Uint8Array(size);
      for (let j = 0; j < size; j++) ui8a[j] = packet[j];
      await bt.write(ui8a);
    }
  };
  const send_request = async (message, response_type) => {
    pending_response = [response_type.ID, Future()];
    await send_message(message)
    return await pending_response[1].promise;
  };
  info_response = await send_request(new InfoRequest(), InfoResponse);
  let notification_response = await send_request(
    new DeviceNotificationRequest(DEVICE_NOTIFICATION_INTERVAL_MS),
    DeviceNotificationResponse,
  );
  let clear_response = await send_request(
    new ClearSlotRequest(EXAMPLE_SLOT), ClearSlotResponse
  );

  let program_crc = crc(EXAMPLE_PROGRAM);
  let start_upload_response = await send_request(
      new StartFileUploadRequest("program.py", EXAMPLE_SLOT, program_crc),
      StartFileUploadResponse,
  );
  let running_crc = 0;
  for (let i = 0; i < EXAMPLE_PROGRAM.length; i += info_response.max_chunk_size) {
    const chunk = EXAMPLE_PROGRAM.slice(i, i + info_response.max_chunk_size);
    running_crc = crc(chunk, running_crc);
    const chunk_response = await send_request(
      new TransferChunkRequest(running_crc, chunk), TransferChunkResponse
    );
  }
  let start_program_response = await send_request(
    new ProgramFlowRequest(false, EXAMPLE_SLOT), ProgramFlowResponse
  );
};

const disconnect = async () => {
  button.disabled = true;
  await bt.disconnect();
  button.textContent = '⏻';
  button.disabled = false;
  show.disabled = true;
  button.onclick = connect;
};

const connect = async () => {
  button.disabled = true
  await bt.connect();
  button.textContent = '⏼';
  button.disabled = false;
  show.disabled = false;
  button.onclick = disconnect;
};

button.onclick = connect;
show.onclick = show_on_matrix;
bt.ondisconnect = disconnect;

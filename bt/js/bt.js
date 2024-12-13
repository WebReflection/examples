const { values } = Object;

export default class BT {
  #connected = false;
  #company;
  #server;
  #services;
  #tx;
  constructor({
    company   = /* LEGO */ 0x0397,
    services  = {
      primary:  '0000fd02-0000-1000-8000-00805f9b34fb',
      // every documentation states the opposite, TX is {2}
      // and RX is {1} but to me ... I send data via TX
      // and receive data via RX so *maybe* everyone else
      // is wrong about this naming convention?
      TX:       '0000fd02-0001-1000-8000-00805f9b34fb',
      RX:       '0000fd02-0002-1000-8000-00805f9b34fb',
    },
    events = {},
  } = {}) {
    this.#company = company;
    this.#services = services;
    this.ondata = events?.ondata || null;
    this.onconnect = events?.onconnect || null;
    this.ondisconnect = events?.ondisconnect || null;
  }

  handleEvent({ target, type }) {
    switch (type) {
      case 'gattserverdisconnected': {
        this.ondisconnect?.();
        break;
      }
      case 'characteristicvaluechanged': {
        this.ondata?.(new Uint8Array(target.value.buffer));
        break;
      }
    }
  }

  async write(view) {
    await this.#tx.writeValueWithoutResponse(view);
  }

  async disconnect() {
    if (this.#connected) {
      this.#connected = false;
      (await this.#server)?.disconnect();
    }
  }

  async connect() {
    if (!this.#connected) {
      const companies = [].concat(this.#company);
      const optionalServices = [...values(this.#services)];
      this.#connected = true;
      return navigator.bluetooth
        .requestDevice({
          filters: [
            {
              manufacturerData: companies.map(
                companyIdentifier => ({ companyIdentifier }),
              )
            }
          ],
          optionalServices,
        })
        .then(
          async device => {
            this.#server = await device.gatt.connect();
            device.addEventListener('gattserverdisconnected', this);
            const service = await this.#server.getPrimaryService(this.#services.primary);
            const rx = await service.getCharacteristic(this.#services.RX);
            await rx.startNotifications();
            rx.addEventListener('characteristicvaluechanged', this);
            this.#tx = await service.getCharacteristic(this.#services.TX);
            this.onconnect?.();
            return this;
          },
          error => {
            this.#connected = false;
            console.error(error);
          }
        )
      ;
    }
    return this;
  }
}

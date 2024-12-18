# (c) https://github.com/LEGO/spike-prime-docs/blob/main/examples/python/app.py

"""
This is a simple example script showing how to

    * Connect to a SPIKE™ Prime hub over BLE
    * Subscribe to device notifications
    * Transfer and start a new program

The script is heavily simplified and not suitable for production use.

----------------------------------------------------------------------

After prompting for confirmation to continue, the script will simply connect to
the first device it finds advertising the SPIKE™ Prime service UUID, and proceed
with the following steps:

    1. Request information about the device (e.g. max chunk size for file transfers)
    2. Subscribe to device notifications (e.g. state of IMU, display, sensors, motors, etc.)
    3. Clear the program in a specific slot
    4. Request transfer of a new program file to the slot
    5. Transfer the program in chunks
    6. Start the program

If the script detects an unexpected response, it will print an error message and exit.
Otherwise it will continue to run until the connection is lost or stopped by the user.
(You can stop the script by pressing Ctrl+C in the terminal.)

While the script is running, it will print information about the messages it sends and receives.
"""

from pyscript.js_modules.bt import default as BT
from pyscript import document
import js

import cobs
from messages import *
from crc import crc

DEVICE_NOTIFICATION_INTERVAL_MS = 500
"""The interval in milliseconds between device notifications"""

EXAMPLE_SLOT = 0
"""The slot to upload the example program to"""


def Future():
    return js.Promise.withResolvers()

bt = BT.new()
button = document.querySelector('#connect')
content = document.querySelector('#content')
show = document.querySelector('#show')

def show_enabled():
    show.disabled = False

async def show_on_matrix(event):
    EXAMPLE_PROGRAM = content.value.strip().encode("utf8")
    """The utf8-encoded example program to upload to the hub"""

    show.disabled = True

    # simple response tracking
    pending_response = (-1, Future())
    ending_response = None

    # callback for when data is received from the hub
    def on_data(ui8a) -> None:
        nonlocal ending_response
        size = ui8a.length
        data = bytearray(size)
        for i in range(0, size):
            data[i] = ui8a[i]

        if data[-1] != 0x02:
            # packet is not a complete message
            # for simplicity, this example does not implement buffering
            # and is therefore unable to handle fragmented messages
            un_xor = bytes(map(lambda x: x ^ 3, data))  # un-XOR for debugging
            print(f"Received incomplete message:\n {un_xor}")
            return

        data = cobs.unpack(data)
        try:
            message = deserialize(data)
            if isinstance(message, ConsoleNotification):
                js.console.info(message.text)
                if message.text is "\r\n":
                    ending_response = Future()
                    ending_response.promise.then(show_enabled)
            else:
                # print(f"Received: {message}")
                if message.ID == pending_response[0]:
                    pending_response[1].resolve(message)
                if isinstance(message, DeviceNotification):
                    # sort and print the messages in the notification
                    updates = list(message.messages)
                    updates.sort(key=lambda x: x[1])
                    lines = [f" - {x[0]:<10}: {x[1]}" for x in updates]
                    print("\n".join(lines))
                    for row in message.messages:
                        if row[0] is "IMU":
                            x, y, z = row[1][3:6]
                            print(x, y, z)
                            js.cube.rotation.x = x / 10
                            # js.cube.rotation.y = y / 10
                            # js.cube.rotation.z = z / 10
                        elif row[0] is "5x5":
                            x = 0
                            y = 0
                            rows = document.querySelectorAll("#matrix tr")
                            # this 5x5 has an initial value that can be skipped
                            for value in row[1][1:]:
                                rows[y].children[x].textContent = value < 50 and " " or "🟩"
                                x += 1
                                if x is 5:
                                    x = 0
                                    y += 1

                elif ending_response is not None and isinstance(message, ProgramFlowNotification):
                    ending_response.resolve()

        except ValueError as e:
            js.console.error(f"Error: {e}")

    bt.ondata = on_data

    # to be initialized
    info_response: InfoResponse = None

    # serialize and pack a message, then send it to the hub
    async def send_message(message: BaseMessage) -> None:
        # print(f"Sending: {message}")
        payload = message.serialize()
        frame = cobs.pack(payload)

        # use the max_packet_size from the info response if available
        # otherwise, assume the frame is small enough to send in one packet
        packet_size = info_response.max_packet_size if info_response else len(frame)

        # send the frame in packets of packet_size
        for i in range(0, len(frame), packet_size):
            packet = frame[i : i + packet_size]
            size = len(packet)
            ui8a = js.Uint8Array.new(size)
            for j in range(0, size):
                ui8a[j] = packet[j]
            await bt.write(ui8a)

    # send a message and wait for a response of a specific type
    async def send_request(message: BaseMessage, response_type):
        nonlocal pending_response
        pending_response = (response_type.ID, Future())
        await send_message(message)
        return await pending_response[1].promise

    # first message should always be an info request
    # as the response contains important information about the hub
    # and how to communicate with it
    info_response = await send_request(InfoRequest(), InfoResponse)

    # enable device notifications
    notification_response = await send_request(
        DeviceNotificationRequest(DEVICE_NOTIFICATION_INTERVAL_MS),
        DeviceNotificationResponse,
    )
    if not notification_response.success:
        js.console.error("Error: failed to enable notifications")

    # clear the program in the example slot
    clear_response = await send_request(
        ClearSlotRequest(EXAMPLE_SLOT), ClearSlotResponse
    )
    if not clear_response.success:
        js.console.warn(
            "ClearSlotRequest was not acknowledged. This could mean the slot was already empty, proceeding..."
        )

    # start a new file upload
    program_crc = crc(EXAMPLE_PROGRAM)
    start_upload_response = await send_request(
        StartFileUploadRequest("program.py", EXAMPLE_SLOT, program_crc),
        StartFileUploadResponse,
    )
    if not start_upload_response.success:
        js.console.error("Error: start file upload was not acknowledged")

    # transfer the program in chunks
    running_crc = 0
    for i in range(0, len(EXAMPLE_PROGRAM), info_response.max_chunk_size):
        chunk = EXAMPLE_PROGRAM[i : i + info_response.max_chunk_size]
        running_crc = crc(chunk, running_crc)
        chunk_response = await send_request(
            TransferChunkRequest(running_crc, chunk), TransferChunkResponse
        )
        if not chunk_response.success:
            js.console.error(f"Error: failed to transfer chunk {i}")

    # start the program
    start_program_response = await send_request(
        ProgramFlowRequest(stop=False, slot=EXAMPLE_SLOT), ProgramFlowResponse
    )

    if not start_program_response.success:
        js.console.error("Error: failed to start program")

async def disconnect(event):
    button.disabled = True
    await bt.disconnect()
    button.textContent = '⏻'
    button.disabled = False
    show.disabled = True
    button.onclick = connect

async def connect(event):
    button.disabled = True
    await bt.connect()
    button.textContent = '⏼'
    button.disabled = False
    show.disabled = False
    button.onclick = disconnect

button.onclick = connect
show.onclick = show_on_matrix
bt.ondisconnect = lambda: disconnect({})

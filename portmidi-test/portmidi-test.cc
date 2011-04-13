// -*- C++ -*-

#include <iostream>
#include <iomanip>
#include <portmidi.h>

using namespace std;

const int QUEUE_SIZE = 10;

main()
{
  cout << "number of MIDI devices: " << Pm_CountDevices() << endl;

  int inputDeviceID = -1;

  for (int id = 0; id < Pm_CountDevices(); id++) {
    const PmDeviceInfo* deviceInfo = Pm_GetDeviceInfo(id);
    if (deviceInfo) {
      cout << id << " "
           << deviceInfo->interf
           << " \""
           << deviceInfo->name
           << "\"";
      if (deviceInfo->input) {
        cout << " [INPUT]";
        if (inputDeviceID == -1) {
          cout << " [SELECTED]";
          inputDeviceID = id;
        }
      }
      if (deviceInfo->output) {
        cout << " [OUTPUT]";
      }
      if (deviceInfo->opened) {
        cout << " [OPENED]";
      }
      cout << endl;
    }
  }

  if (inputDeviceID == -1) {
    cout << "no input device found, exiting" << endl;
    exit(1);
  }

  PortMidiStream* midiStream = 0;
  PmError error = Pm_OpenInput(&midiStream,
                               inputDeviceID,
                               0,
                               QUEUE_SIZE,
                               0,
                               0);
  if (error < 0) {
    cout << "Error opening input device " << inputDeviceID << ": " << Pm_GetErrorText(error) << endl;
    exit(1);
  }

  while (true) {
    static PmEvent inputEvents[QUEUE_SIZE];
    int retval = Pm_Read(midiStream, inputEvents, QUEUE_SIZE);
    if (retval < 0) {
      cout << "Error receiving events: " << Pm_GetErrorText((PmError) error) << endl;
      exit(1);
    }
    for (int i = 0; i < retval; i++) {
      cout << i << ": " << inputEvents[i].timestamp << " "
           << hex << setw(2) << setfill('0') << Pm_MessageStatus(inputEvents[i].message) << ' '
           << hex << setw(2) << setfill('0') << Pm_MessageData1(inputEvents[i].message) << ' '
           << hex << setw(2) << setfill('0') << Pm_MessageData2(inputEvents[i].message)
           << dec << endl;
    }
  }
}

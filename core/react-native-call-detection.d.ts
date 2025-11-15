// react-native-call-detection.d.ts

declare module 'react-native-call-detection' {
  // Define the possible call states the native module reports
  type CallState = 'Incoming' | 'Disconnected' | 'Connected' | 'Outgoing' | 'Missed';

  interface CallDetectionManager {
    // Define the start function signature
    start(callback: (event: CallState) => void): void;

    // Define the stop function signature (optional but good practice)
    stop(): void;
  }

  const manager: CallDetectionManager;
  export default manager;
}
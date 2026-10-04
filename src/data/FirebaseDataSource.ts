/**
 * FirebaseDataSource – stub for Live mode.
 * TODO: Replace TODOs with real Firebase + MQTT implementation.
 */

import type { DataSource, PanelStatus, Command, FullHistory } from './DataSource';

export class FirebaseDataSource implements DataSource {
  // TODO: Initialize Firebase app here
  // import { initializeApp } from 'firebase/app';
  // import { getDatabase, ref, onValue } from 'firebase/database';

  subscribeStatus(callback: (s: PanelStatus) => void): () => void {
    // TODO: Subscribe to Firebase Realtime Database path '/panel/status'
    // const db = getDatabase();
    // const statusRef = ref(db, '/panel/status');
    // const unsub = onValue(statusRef, (snapshot) => {
    //   callback(snapshot.val() as PanelStatus);
    // });
    // return () => off(statusRef, 'value', unsub);

    console.warn('[FirebaseDataSource] subscribeStatus not implemented');
    return () => {};
  }

  async sendCommand(cmd: Command): Promise<void> {
    // TODO: Publish command to MQTT topic or Firebase RTDB command queue
    // const db = getDatabase();
    // await set(ref(db, '/panel/commands'), { ...cmd, timestamp: Date.now() });

    console.warn('[FirebaseDataSource] sendCommand not implemented', cmd);
  }

  async getHistory(): Promise<FullHistory> {
    // TODO: Fetch from Firestore collection 'history'
    // const db = getFirestore();
    // const snapshot = await getDocs(collection(db, 'history'));
    // return snapshot.docs.map(d => d.data()) as FullHistory;

    console.warn('[FirebaseDataSource] getHistory not implemented');
    return { hourly: [], cleaningEvents: [] };
  }
}

declare module '@azure/communication-common' {
  export class AzureCommunicationTokenCredential {
    constructor(token: string);
    dispose(): void;
  }
}

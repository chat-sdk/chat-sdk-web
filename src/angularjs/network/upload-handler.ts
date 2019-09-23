
export interface IUploadHandler {
  uploadFile(file: File): Promise<{}>
}

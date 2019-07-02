
export interface IUploadHandler {
    uploadFile(file: File): ng.IPromise<{}>
}

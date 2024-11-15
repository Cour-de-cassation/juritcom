export interface DecisionRepository {
  saveDataDecisionIntegre(
    jsonToString: string,
    originalPdfFileName: string,
    jsonS3Key: string
  ): Promise<void>

  uploadFichierDecisionIntegre(
    fichierDecisionIntegre: Express.Multer.File | Buffer,
    archivePdfFileName: string,
    pdfS3Key: string
  ): Promise<void>
}

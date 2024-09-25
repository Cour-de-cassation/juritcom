export interface DecisionRepository {
  saveDataDecisionIntegre(
    jsonToString: string,
    originalFileName: string,
    jsonFileName?: string
  ): Promise<void>

  uploadFichierDecisionIntegre(
    fichierDecisionIntegre: Express.Multer.File,
    originalFileName: string,
    pdfFileName: string
  ): Promise<void>
}

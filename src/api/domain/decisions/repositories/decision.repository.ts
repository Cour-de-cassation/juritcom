export interface DecisionRepository {
  saveDecisionIntegre(decisionIntegre: string, filename?: string): Promise<void>;

  saveDecisionNormalisee(decisionIntegre: string, filename?: string): Promise<void>;

  saveDataDecisionIntegre(jsonToString: string, originalFileName: string, jsonFileName?: string): Promise<void>;

  uploadFichierDecisionIntegre(fichierDecisionIntegre: Express.Multer.File, originalFileName: string, pdfFileName: string): Promise<void>;
}

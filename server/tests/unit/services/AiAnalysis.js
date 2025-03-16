import { jest } from '@jest/globals';
import AIAnalysisService from '../../../src/services/ai/AIAnalysisService';
import OllamaClient from '../../../src/services/integrations/OllamaClient';
import ThreatIntelligenceService from '../../../src/services/integrations/ThreatIntelligenceService';

describe('AI Analysis Service', () => {
  let aiAnalysisService;
  let mockScan;
  let mockFindings;

  beforeEach(() => {
    // Create a new instance of AIAnalysisService for each test
    aiAnalysisService = new AIAnalysisService();

    // Create mock scan and findings
    mockScan = {
      _id: 'mockScanId',
      url: 'https://example.com',
      scanType: ['headers', 'ssl']
    };

    mockFindings = [
      { 
        type: 'headers', 
        description: 'Missing security headers',
        score: 7.5 
      },
      { 
        type: 'ssl', 
        description: 'Weak SSL configuration',
        score: 8.2 
      }
    ];

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('generateReportInsights', () => {
    it('should generate comprehensive report insights', async () => {
      // Mock Ollama client for generating insights
      jest.spyOn(OllamaClient, 'generateInsights').mockResolvedValue({
        summary: 'Comprehensive security analysis of the website',
        additionalFindings: [
          { 
            type: 'network', 
            description: 'Potential open ports detected',
            severity: 'medium'
          }
        ]
      });

      // Mock Threat Intelligence service
      jest.spyOn(ThreatIntelligenceService, 'enrichFindings').mockResolvedValue([
        ...mockFindings,
        { 
          type: 'threat_intel', 
          description: 'Known vulnerability associated with the domain',
          score: 6.8
        }
      ]);

      const insights = await aiAnalysisService.generateReportInsights({
        scan: mockScan,
        findings: mockFindings
      });

      // Verify Ollama client was called
      expect(OllamaClient.generateInsights).toHaveBeenCalledWith({
        url: mockScan.url,
        findings: mockFindings
      });

      // Verify Threat Intelligence service was called
      expect(ThreatIntelligenceService.enrichFindings).toHaveBeenCalledWith(mockFindings);

      // Verify returned insights
      expect(insights).toEqual({
        summary: expect.any(String),
        additionalFindings: expect.any(Array),
        enrichedFindings: expect.any(Array)
      });

      // Verify additional insights were added
      expect(insights.additionalFindings).toHaveLength(1);
      expect(insights.enrichedFindings).toHaveLength(3);
    });

    it('should handle errors in insight generation', async () => {
      // Mock Ollama client to throw an error
      jest.spyOn(OllamaClient, 'generateInsights').mockRejectedValue(
        new Error('Insight generation failed')
      );

      // Mock Threat Intelligence service to return original findings
      jest.spyOn(ThreatIntelligenceService, 'enrichFindings').mockResolvedValue(mockFindings);

      const insights = await aiAnalysisService.generateReportInsights({
        scan: mockScan,
        findings: mockFindings
      });

      // Verify fallback behavior
      expect(insights).toEqual({
        summary: expect.stringContaining('Unable to generate comprehensive insights'),
        additionalFindings: [],
        enrichedFindings: mockFindings
      });
    });

    it('should handle no findings scenario', async () => {
      const emptyFindings = [];

      // Mock Ollama client
      jest.spyOn(OllamaClient, 'generateInsights').mockResolvedValue({
        summary: 'No significant security issues detected',
        additionalFindings: []
      });

      // Mock Threat Intelligence service
      jest.spyOn(ThreatIntelligenceService, 'enrichFindings').mockResolvedValue([]);

      const insights = await aiAnalysisService.generateReportInsights({
        scan: mockScan,
        findings: emptyFindings
      });

      // Verify insights for no findings
      expect(insights).toEqual({
        summary: expect.stringContaining('No significant security issues detected'),
        additionalFindings: [],
        enrichedFindings: []
      });
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score based on findings', () => {
      const riskScore = aiAnalysisService.calculateRiskScore(mockFindings);

      // Expected calculation: average of finding scores
      const expectedScore = (7.5 + 8.2) / 2;

      expect(riskScore).toBeCloseTo(expectedScore);
    });

    it('should handle empty findings', () => {
      const riskScore = aiAnalysisService.calculateRiskScore([]);

      expect(riskScore).toBe(0);
    });

    it('should round risk score to two decimal places', () => {
      const complexFindings = [
        { type: 'headers', description: 'Minor header issue', score: 3.333 },
        { type: 'ssl', description: 'Moderate SSL weakness', score: 6.667 }
      ];

      const riskScore = aiAnalysisService.calculateRiskScore(complexFindings);

      expect(riskScore).toBeCloseTo(5, 2);
    });
  });

  describe('prioritizeFindings', () => {
    it('should prioritize findings by severity', () => {
      const mixedFindings = [
        { type: 'headers', description: 'Minor header issue', score: 3.5 },
        { type: 'ssl', description: 'Critical SSL vulnerability', score: 9.2 },
        { type: 'performance', description: 'Slow page load', score: 5.0 }
      ];

      const prioritizedFindings = aiAnalysisService.prioritizeFindings(mixedFindings);

      // Verify findings are sorted by score in descending order
      expect(prioritizedFindings[0].score).toBe(9.2);
      expect(prioritizedFindings[1].score).toBe(5.0);
      expect(prioritizedFindings[2].score).toBe(3.5);
    });

    it('should handle empty findings array', () => {
      const prioritizedFindings = aiAnalysisService.prioritizeFindings([]);

      expect(prioritizedFindings).toHaveLength(0);
    });
  });
});

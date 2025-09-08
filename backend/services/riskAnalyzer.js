class RiskAnalyzer {
  constructor() {
    // Define risk keywords and their severity levels
    this.riskKeywords = {
      high: [
        'indemnify', 'indemnification', 'liability', 'liable', 'damages', 'penalty', 'penalties',
        'forfeit', 'forfeiture', 'breach', 'default', 'terminate', 'termination',
        'waiver', 'waive', 'disclaim', 'disclaimer', 'exclude', 'exclusion',
        'limitation of liability', 'force majeure', 'arbitration', 'dispute resolution',
        'severability', 'non-compete', 'confidentiality', 'proprietary', 'intellectual property',
        'infringement', 'cease and desist', 'injunctive relief', 'liquidated damages'
      ],
      medium: [
        'obligation', 'obligations', 'restriction', 'restrictions', 'limitation', 'limitations',
        'condition', 'conditions', 'requirement', 'requirements', 'compliance', 'conform',
        'subject to', 'provided that', 'notwithstanding', 'except', 'excluding',
        'modification', 'amendment', 'change', 'alter', 'update',
        'notice', 'notification', 'inform', 'notify', 'consent', 'approval',
        'assignment', 'transfer', 'delegate', 'sublicense'
      ],
      low: [
        'standard', 'typical', 'usual', 'customary', 'reasonable', 'fair',
        'good faith', 'best efforts', 'commercially reasonable', 'industry standard',
        'revocable', 'cancelable', 'optional', 'voluntary', 'at will',
        'mutual', 'reciprocal', 'bilateral', 'both parties'
      ]
    };

    // Define document-specific risk patterns
    this.documentPatterns = {
      employment: {
        keywords: ['employment', 'employee', 'employer', 'work', 'job', 'position', 'salary', 'wage'],
        risks: {
          high: ['non-compete', 'at-will employment', 'termination without cause'],
          medium: ['probationary period', 'confidentiality', 'overtime policies'],
          low: ['standard benefits', 'vacation policy', 'work hours']
        }
      },
      lease: {
        keywords: ['lease', 'rent', 'tenant', 'landlord', 'property', 'premises'],
        risks: {
          high: ['security deposit forfeiture', 'eviction', 'rent increases'],
          medium: ['maintenance responsibilities', 'subletting restrictions'],
          low: ['standard lease terms', 'utilities', 'parking']
        }
      },
      software: {
        keywords: ['software', 'license', 'application', 'program', 'code'],
        risks: {
          high: ['usage restrictions', 'reverse engineering prohibition', 'liability limitations'],
          medium: ['update policies', 'support terms', 'compatibility'],
          low: ['standard license', 'documentation', 'installation']
        }
      },
      privacy: {
        keywords: ['privacy', 'data', 'personal information', 'collection', 'processing'],
        risks: {
          high: ['data sharing with third parties', 'international transfers', 'data retention'],
          medium: ['cookie usage', 'marketing communications', 'analytics'],
          low: ['standard privacy practices', 'data security', 'user rights']
        }
      }
    };
  }

  analyzeRisks(text) {
    const textLower = text.toLowerCase();
    const documentType = this.detectDocumentType(textLower);
    
    const riskFactors = this.findRiskFactors(textLower);
    const specificRisks = this.findDocumentSpecificRisks(textLower, documentType);
    const overallRisk = this.calculateOverallRisk(riskFactors, specificRisks);

    return {
      overallRisk: overallRisk.level,
      confidence: overallRisk.confidence,
      documentType,
      riskFactors: [...riskFactors, ...specificRisks],
      recommendations: this.generateRecommendations(overallRisk.level, riskFactors, specificRisks),
      analysis: {
        totalFactors: riskFactors.length + specificRisks.length,
        highRiskCount: [...riskFactors, ...specificRisks].filter(r => r.level === 'high').length,
        mediumRiskCount: [...riskFactors, ...specificRisks].filter(r => r.level === 'medium').length,
        lowRiskCount: [...riskFactors, ...specificRisks].filter(r => r.level === 'low').length
      }
    };
  }

  detectDocumentType(textLower) {
    const types = Object.keys(this.documentPatterns);
    
    for (const type of types) {
      const keywords = this.documentPatterns[type].keywords;
      const matches = keywords.filter(keyword => textLower.includes(keyword)).length;
      
      // If more than 30% of keywords match, consider it this document type
      if (matches / keywords.length > 0.3) {
        return type;
      }
    }
    
    return 'general';
  }

  findRiskFactors(textLower) {
    const factors = [];
    
    // Check for high-risk keywords
    this.riskKeywords.high.forEach(keyword => {
      if (textLower.includes(keyword)) {
        factors.push({
          type: 'keyword',
          level: 'high',
          keyword: keyword,
          description: `Contains high-risk term: "${keyword}"`
        });
      }
    });

    // Check for medium-risk keywords
    this.riskKeywords.medium.forEach(keyword => {
      if (textLower.includes(keyword)) {
        factors.push({
          type: 'keyword',
          level: 'medium',
          keyword: keyword,
          description: `Contains restrictive term: "${keyword}"`
        });
      }
    });

    // Check for low-risk (positive) keywords
    this.riskKeywords.low.forEach(keyword => {
      if (textLower.includes(keyword)) {
        factors.push({
          type: 'keyword',
          level: 'low',
          keyword: keyword,
          description: `Contains favorable term: "${keyword}"`
        });
      }
    });

    // Remove duplicates and limit to most relevant
    const uniqueFactors = factors.filter((factor, index, self) => 
      index === self.findIndex(f => f.keyword === factor.keyword)
    );

    return uniqueFactors.slice(0, 10); // Limit to top 10 factors
  }

  findDocumentSpecificRisks(textLower, documentType) {
    if (!this.documentPatterns[documentType]) {
      return [];
    }

    const specificRisks = [];
    const patterns = this.documentPatterns[documentType].risks;

    Object.keys(patterns).forEach(level => {
      patterns[level].forEach(riskPattern => {
        if (textLower.includes(riskPattern.toLowerCase())) {
          specificRisks.push({
            type: 'specific',
            level: level,
            pattern: riskPattern,
            description: `${documentType} document risk: ${riskPattern}`
          });
        }
      });
    });

    return specificRisks;
  }

  calculateOverallRisk(riskFactors, specificRisks) {
    const allFactors = [...riskFactors, ...specificRisks];
    
    if (allFactors.length === 0) {
      return { level: 'low', confidence: 0.5 };
    }

    const highCount = allFactors.filter(f => f.level === 'high').length;
    const mediumCount = allFactors.filter(f => f.level === 'medium').length;
    const lowCount = allFactors.filter(f => f.level === 'low').length;
    
    // Calculate weighted score
    const score = (highCount * 3) + (mediumCount * 2) + (lowCount * 1);
    const maxPossibleScore = allFactors.length * 3;
    const normalizedScore = score / maxPossibleScore;

    let level, confidence;
    
    if (normalizedScore >= 0.7 || highCount >= 3) {
      level = 'high';
      confidence = Math.min(0.9, 0.6 + (normalizedScore * 0.3));
    } else if (normalizedScore >= 0.4 || highCount >= 1) {
      level = 'medium';
      confidence = 0.6 + (normalizedScore * 0.2);
    } else {
      level = 'low';
      confidence = Math.max(0.5, 0.8 - (normalizedScore * 0.3));
    }

    return { level, confidence: Math.round(confidence * 100) / 100 };
  }

  generateRecommendations(riskLevel, riskFactors, specificRisks) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'high':
        recommendations.push('🚨 Strongly recommend legal review before signing');
        recommendations.push('📝 Pay special attention to liability and termination clauses');
        recommendations.push('💬 Consider negotiating the most concerning terms');
        break;
      case 'medium':
        recommendations.push('⚠️ Review all terms carefully before agreeing');
        recommendations.push('❓ Ask questions about anything you don\'t understand');
        recommendations.push('📋 Keep records of all communications');
        break;
      case 'low':
        recommendations.push('✅ Document appears to have standard terms');
        recommendations.push('📖 Read through completely to understand obligations');
        recommendations.push('🤝 Generally safe to proceed with normal caution');
        break;
    }

    // Add specific recommendations based on risk factors
    const highRiskFactors = [...riskFactors, ...specificRisks].filter(f => f.level === 'high');
    if (highRiskFactors.length > 0) {
      recommendations.push(`🎯 Key areas of concern: ${highRiskFactors.map(f => f.keyword || f.pattern).join(', ')}`);
    }

    return recommendations;
  }

  // Utility function to highlight risky text sections
  highlightRiskyText(text, riskAnalysis) {
    let highlightedText = text;
    
    riskAnalysis.riskFactors.forEach(factor => {
      const keyword = factor.keyword || factor.pattern;
      if (keyword) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const color = factor.level === 'high' ? 'red' : factor.level === 'medium' ? 'orange' : 'green';
        highlightedText = highlightedText.replace(regex, `<mark class="risk-${factor.level}" style="background-color: ${color}; color: white; padding: 1px 3px; border-radius: 2px;">$&</mark>`);
      }
    });

    return highlightedText;
  }

  // Generate a risk summary for display
  generateRiskSummary(riskAnalysis) {
    const { overallRisk, analysis, documentType, confidence } = riskAnalysis;
    
    const emoji = overallRisk === 'high' ? '🔴' : overallRisk === 'medium' ? '🟡' : '🟢';
    const riskText = overallRisk.toUpperCase();
    
    return {
      emoji,
      level: riskText,
      confidence: `${confidence * 100}%`,
      summary: `${emoji} **${riskText} RISK** (${Math.round(confidence * 100)}% confidence)`,
      details: `Found ${analysis.totalFactors} risk factors: ${analysis.highRiskCount} high, ${analysis.mediumRiskCount} medium, ${analysis.lowRiskCount} low`,
      documentType: documentType.charAt(0).toUpperCase() + documentType.slice(1),
      quickAction: overallRisk === 'high' ? 'Consider legal consultation' : 
                   overallRisk === 'medium' ? 'Review carefully' : 'Proceed with caution'
    };
  }
}

// Create singleton instance
const riskAnalyzer = new RiskAnalyzer();

// Export main function
export function analyzeRisks(text) {
  return riskAnalyzer.analyzeRisks(text);
}

// Export utility functions
export function highlightRiskyText(text, riskAnalysis) {
  return riskAnalyzer.highlightRiskyText(text, riskAnalysis);
}

export function generateRiskSummary(riskAnalysis) {
  return riskAnalyzer.generateRiskSummary(riskAnalysis);
}

export default riskAnalyzer;

import React from 'react';
import PropTypes from 'prop-types';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

/**
 * SecurityScoreCard Component
 * 
 * Displays a security score with visual indicators based on the score value.
 * Scores are represented with different colors and icons based on severity levels.
 */
const SecurityScoreCard = ({ 
  title = 'Security Score',
  score = 0,
  maxScore = 100,
  category = 'General',
  description = '',
  issues = [],
  lastUpdated = null,
  className = '',
}) => {
  // Calculate score percentage for visual representation
  const scorePercentage = Math.round((score / maxScore) * 100);
  
  // Determine status based on score percentage
  const getScoreStatus = () => {
    if (scorePercentage >= 90) return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Excellent' };
    if (scorePercentage >= 70) return { color: 'bg-blue-100 text-blue-800', icon: Shield, label: 'Good' };
    if (scorePercentage >= 50) return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Fair' };
    return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Poor' };
  };

  const { color, icon: StatusIcon, label } = getScoreStatus();
  
  // Format date if provided
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <span className="text-sm text-gray-300">{category}</span>
      </div>
      
      {/* Score Section */}
      <div className="p-4 bg-white">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${color} mr-3`}>
            <StatusIcon size={24} />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-gray-500 ml-1">/ {maxScore}</span>
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm mb-4">{description}</p>
        )}
        
        {/* Score Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full ${
              scorePercentage >= 90 ? 'bg-green-500' :
              scorePercentage >= 70 ? 'bg-blue-500' :
              scorePercentage >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
        
        {/* Issues List */}
        {issues.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Issues to Address</h4>
            <ul className="text-sm text-gray-600">
              {issues.slice(0, 3).map((issue, index) => (
                <li key={index} className="flex items-start mb-1">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
              {issues.length > 3 && (
                <li className="text-sm text-gray-500 italic">
                  +{issues.length - 3} more issues
                </li>
              )}
            </ul>
          </div>
        )}
        
        {/* Last Updated */}
        <div className="mt-4 text-xs text-gray-500">
          Last updated: {formattedDate}
        </div>
      </div>
    </div>
  );
};

SecurityScoreCard.propTypes = {
  title: PropTypes.string,
  score: PropTypes.number,
  maxScore: PropTypes.number,
  category: PropTypes.string,
  description: PropTypes.string,
  issues: PropTypes.arrayOf(PropTypes.string),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  className: PropTypes.string,
};

export default SecurityScoreCard;

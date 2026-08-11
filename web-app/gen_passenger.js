const fs = require('fs');
const path = 'C:/yaalii/Intercity_and_interacity_ride_sharing/web-app/src/pages/admin/PassengerManagement.jsx';
const content = fs.readFileSync(path, 'utf8');

// We need to transform the file to match DriverManagement patterns
// Strategy: do targeted replacements on the existing file

let updated = content;

// 1. Replace import line to add missing icons
updated = updated.replace(
  /import \{[\s\S]*?\} from 'react-icons\/fa';/,
  `import {
  FaUsers, FaUserCheck, FaUserTimes, FaStar, FaWallet, FaSearch,
  FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaBan,
  FaMoneyBillWave, FaIdCard, FaHistory, FaExclamationTriangle,
  FaEnvelope, FaExclamationCircle,
  FaUserSlash, FaUserShield, FaToggleOn, FaDownload, FaSync, FaPlus,
  FaPaperPlane, FaChartBar, FaCar, FaTimes, FaCheck, FaTrash,
  FaUser, FaShieldAlt
} from 'react-icons/fa';`
);

// 2. Add getRating helper after statusBg
updated = updated.replace(
  /const getPassengerStatusBg = \(status\) => \{[\s\S]*?\n  \};/,
  `const getPassengerStatusBg = (status) => {
    switch (status) {
      case 'active': return 'rgba(16, 185, 129, 0.1)';
      case 'suspended': return 'rgba(239, 68, 68, 0.1)';
      case 'banned': return 'rgba(127, 29, 29, 0.1)';
      case 'inactive': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getRating = (p) => {
    if (typeof p.rating === 'number') return p.rating;
    if (p.rating && typeof p.rating === 'object') return p.rating.average || 0;
    return 0;
  };`
);

console.log('Lines:', updated.split('\n').length);
fs.writeFileSync(path, updated);
console.log('File updated');

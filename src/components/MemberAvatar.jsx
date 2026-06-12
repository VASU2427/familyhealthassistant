import React, { useState } from 'react';

export const themeColors = {
  teal: { primary: '#0a9e7c', primaryLight: 'rgba(10, 158, 124, 0.15)', borderFocus: '#0a9e7c' },
  blue: { primary: '#0284c7', primaryLight: 'rgba(2, 132, 199, 0.15)', borderFocus: '#0284c7' },
  rose: { primary: '#e11d48', primaryLight: 'rgba(225, 29, 72, 0.15)', borderFocus: '#e11d48' },
  amber: { primary: '#d97706', primaryLight: 'rgba(217, 119, 6, 0.15)', borderFocus: '#d97706' },
  purple: { primary: '#7c3aed', primaryLight: 'rgba(124, 58, 237, 0.15)', borderFocus: '#7c3aed' },
  indigo: { primary: '#4f46e5', primaryLight: 'rgba(79, 70, 229, 0.15)', borderFocus: '#4f46e5' }
};

export const MemberAvatar = ({ avatarVal, size = '1.75rem', memberName = '', colorTheme = 'teal', extraStyle = {} }) => {
  const [imgError, setImgError] = useState(false);
  
  const isImg = avatarVal && (
    avatarVal.startsWith('data:image/') || 
    avatarVal.startsWith('data:') || 
    avatarVal.endsWith('.png') || 
    avatarVal.endsWith('.jpg') || 
    avatarVal.endsWith('.jpeg') || 
    avatarVal.includes('/')
  );
  
  const theme = themeColors[colorTheme || 'teal'] || themeColors.teal;
  const primaryColor = theme?.primary || '#0a9e7c';
  const isFullSize = size === '100%';
  
  const containerStyle = {
    width: isFullSize ? '100%' : size,
    height: isFullSize ? '100%' : size,
    minWidth: isFullSize ? '100%' : size,
    minHeight: isFullSize ? '100%' : size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    flexShrink: 0,
    ...(!isFullSize ? {
      border: `2px solid ${primaryColor}`,
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)'
    } : {}),
    ...extraStyle
  };
  
  if (isImg && !imgError) {
    return (
      <div style={containerStyle} className="avatar-photo-container">
        <img 
          src={avatarVal} 
          alt={memberName || "Avatar"} 
          onError={() => setImgError(true)}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block'
          }} 
        />
      </div>
    );
  }
  
  const initial = memberName ? memberName.charAt(0).toUpperCase() : 'U';
  return (
    <div style={{
      ...containerStyle,
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${theme.primaryLight || 'rgba(10, 158, 124, 0.15)'} 100%)`,
      color: '#ffffff',
      fontWeight: '800',
      fontSize: isFullSize ? '0.9rem' : `calc(${size} * 0.42)`,
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
      textTransform: 'uppercase'
    }}>
      {initial}
    </div>
  );
};

export const renderAvatar = (memberOrVal, size = '1.75rem', extraStyle = {}) => {
  let avatarVal = '';
  let name = '';
  let colorTheme = 'teal';
  
  if (memberOrVal && typeof memberOrVal === 'object') {
    avatarVal = memberOrVal.avatar || memberOrVal.avatarUrl;
    name = memberOrVal.name;
    colorTheme = memberOrVal.colorTheme || memberOrVal.themeColor || 'teal';
  } else {
    avatarVal = memberOrVal;
    if (avatarVal === '👨') { name = 'Srinivas'; colorTheme = 'teal'; avatarVal = '/avatar_srinivas.png'; }
    else if (avatarVal === '🤰') { name = 'Lakshmi'; colorTheme = 'rose'; avatarVal = '/avatar_lakshmi.png'; }
    else if (avatarVal === '👶') { name = 'Sia'; colorTheme = 'blue'; avatarVal = '/avatar_sia.png'; }
    else { name = 'U'; colorTheme = 'teal'; }
  }
  
  if (avatarVal === '👨') avatarVal = '/avatar_srinivas.png';
  else if (avatarVal === '🤰') avatarVal = '/avatar_lakshmi.png';
  else if (avatarVal === '👶') avatarVal = '/avatar_sia.png';
  
  return (
    <MemberAvatar 
      avatarVal={avatarVal} 
      size={size} 
      memberName={name} 
      colorTheme={colorTheme} 
      extraStyle={extraStyle} 
    />
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Theme = 'business' | 'dashboard' | 'landing' | 'classic' | 'employment';

export default function Home() {
  const navigate = useNavigate();
  const [bizno, setBizno] = useState('');
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>('business');

  // 사업자번호 유효성 검사
  const validateBizno = (bizno: string) => {
    const cleaned = bizno.replace(/[^0-9]/g, '');
    return cleaned.length === 10;
  };

  // 사업자번호 포맷팅 (123-45-67890)
  const formatBizno = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 10)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handleBiznoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBizno(e.target.value);
    setBizno(formatted);
    setError('');
  };

  const handleAnalyze = () => {
    if (!validateBizno(bizno)) {
      setError('올바른 사업자번호를 입력해주세요 (10자리 숫자)');
      return;
    }

    const cleanedBizno = bizno.replace(/[^0-9]/g, '');
    navigate(`/dashboard/${cleanedBizno}`);
  };

  const handleSampleAnalysis = (sampleBizno: string, companyName: string) => {
    navigate(`/dashboard/${sampleBizno}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  // 🎨 테마별 스타일 정의
  const themes = {
    business: {
      name: '🏢 모던 비즈니스',
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      header: {
        textAlign: 'center' as const,
        padding: '60px 20px',
        position: 'relative' as const
      },
      title: {
        fontSize: '3.5rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '24px',
        textShadow: '0 4px 8px rgba(0,0,0,0.3)',
        letterSpacing: '-0.02em'
      },
      subtitle: {
        fontSize: '1.25rem',
        color: '#e2e8f0',
        marginBottom: '12px',
        fontWeight: '300'
      },
      description: {
        fontSize: '1rem',
        color: '#cbd5e1',
        opacity: 0.8
      },
      card: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        margin: '0 20px'
      },
      button: {
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        color: '#0f172a',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 16px rgba(251, 191, 36, 0.3)'
      },
      sampleButton: {
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }
    },
    dashboard: {
      name: '📊 대시보드',
      container: {
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      header: {
        background: 'white',
        borderRadius: '12px',
        padding: '40px 32px',
        margin: '24px',
        borderLeft: '4px solid #3b82f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      title: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      },
      subtitle: {
        fontSize: '1.125rem',
        color: '#6b7280',
        marginBottom: '8px'
      },
      description: {
        fontSize: '0.875rem',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      },
      card: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        margin: '0 24px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s ease'
      },
      button: {
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '1rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      },
      sampleButton: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }
    },
    landing: {
      name: '🚀 랜딩페이지',
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative' as const,
        overflow: 'hidden' as const
      },
      header: {
        textAlign: 'center' as const,
        padding: '80px 20px',
        position: 'relative' as const,
        zIndex: 10
      },
      title: {
        fontSize: '4rem',
        fontWeight: '900',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #dbeafe 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 4px 16px rgba(0,0,0,0.3)',
        animation: 'pulse 3s ease-in-out infinite alternate'
      },
      subtitle: {
        fontSize: '1.5rem',
        marginBottom: '16px',
        fontWeight: '500',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      },
      description: {
        fontSize: '1.125rem',
        opacity: 0.9,
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      },
      card: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '40px',
        margin: '0 20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
        transform: 'perspective(1000px) rotateX(5deg)',
        transition: 'all 0.3s ease'
      },
      button: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        padding: '18px 32px',
        fontSize: '1.2rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
      },
      sampleButton: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)'
      }
    },
    classic: {
      name: '💼 클래식',
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        color: '#1f2937',
        fontFamily: 'Georgia, serif'
      },
      header: {
        textAlign: 'center' as const,
        padding: '50px 20px',
        borderBottom: '2px solid #e5e7eb'
      },
      title: {
        fontSize: '3rem',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '20px',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      subtitle: {
        fontSize: '1.25rem',
        color: '#374151',
        marginBottom: '12px',
        fontWeight: '400'
      },
      description: {
        fontSize: '1rem',
        color: '#6b7280'
      },
      card: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        margin: '0 24px 24px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      },
      button: {
        background: '#1e40af',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 24px',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      },
      sampleButton: {
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }
    },
    employment: {
      name: '👔 고용이력부',
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      header: {
        background: 'rgba(30, 58, 138, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '40px 32px',
        margin: '0',
        borderBottom: '3px solid #fbbf24'
      },
      title: {
        fontSize: '2.8rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      },
      subtitle: {
        fontSize: '1.25rem',
        color: '#dbeafe',
        marginBottom: '8px',
        textAlign: 'center' as const,
        fontWeight: '500'
      },
      description: {
        fontSize: '1rem',
        color: '#bfdbfe',
        textAlign: 'center' as const,
        opacity: 0.9
      },
      card: {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        margin: '24px auto',
        maxWidth: '600px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        color: '#1f2937'
      },
      button: {
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 28px',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
      },
      sampleButton: {
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }
  };

  const currentThemeStyles = themes[currentTheme];

  return (
    <div style={currentThemeStyles.container}>
      
      {/* 🚀 랜딩 테마 전용 배경 애니메이션 */}
      {currentTheme === 'landing' && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,107,107,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-20%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(72,219,251,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(254,202,87,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse 4s ease-in-out infinite'
          }}></div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 테마 선택 버튼들 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
          borderBottom: currentTheme === 'dashboard' ? '1px solid #e5e7eb' : 'none'
        }}>
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setCurrentTheme(key as Theme)}
              style={{
                padding: '10px 20px',
                borderRadius: '25px',
                border: currentTheme === key ? 'none' : '1px solid rgba(255,255,255,0.3)',
                background: currentTheme === key 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: currentTheme === key ? 'white' : 'inherit',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                transform: currentTheme === key ? 'scale(1.05)' : 'scale(1)',
                boxShadow: currentTheme === key ? '0 4px 12px rgba(59,130,246,0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (currentTheme !== key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseOut={(e) => {
                if (currentTheme !== key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {theme.name}
            </button>
          ))}
        </div>

        {/* 헤더 */}
        <div style={currentThemeStyles.header}>
          <h1 style={currentThemeStyles.title}>
            {currentTheme === 'dashboard' && <span>📊</span>}
            {currentTheme === 'landing' && <span style={{ animation: 'rotate 2s linear infinite' }}>⚡</span>}
            세무 크레딧 분석 시스템
          </h1>
          <p style={currentThemeStyles.subtitle}>
            고용증대세액공제 & 사회보험료세액공제 분석
          </p>
          <p style={currentThemeStyles.description}>
            {currentTheme === 'dashboard' && <span>📈</span>}
            사업자번호를 입력하여 세액공제 혜택을 확인해보세요
          </p>
        </div>

        {/* 검색 카드 */}
        <div style={currentThemeStyles.card}>
          <h2 style={{
            fontSize: currentTheme === 'landing' ? '2rem' : '1.5rem',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center',
            color: 'inherit'
          }}>
            {currentTheme === 'dashboard' && <span style={{ marginRight: '8px' }}>🔍</span>}
            {currentTheme === 'landing' && <span style={{ marginRight: '8px', animation: 'pulse 2s infinite' }}>🎯</span>}
            사업자번호 검색
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
                  type="text"
              placeholder="사업자번호를 입력하세요 (예: 123-45-67890)"
                  value={bizno}
                  onChange={handleBiznoChange}
                  onKeyPress={handleKeyPress}
              style={{
                padding: currentTheme === 'landing' ? '16px 20px' : '12px 16px',
                borderRadius: currentTheme === 'landing' ? '50px' : '8px',
                border: currentTheme === 'business' 
                  ? '1px solid rgba(251,191,36,0.3)' 
                  : currentTheme === 'landing'
                  ? '2px solid rgba(255,255,255,0.3)'
                  : '1px solid #d1d5db',
                fontSize: '1.1rem',
                textAlign: 'center',
                outline: 'none',
                background: currentTheme === 'business'
                  ? 'rgba(15,23,42,0.6)'
                  : currentTheme === 'landing'
                  ? 'rgba(255,255,255,0.1)'
                  : 'white',
                color: currentTheme === 'business' || currentTheme === 'landing' ? 'white' : '#374151',
                backdropFilter: currentTheme === 'landing' ? 'blur(10px)' : 'none',
                transition: 'all 0.3s ease'
              }}
                  maxLength={12}
              onFocus={(e) => {
                e.target.style.borderColor = currentTheme === 'business' 
                  ? '#fbbf24' 
                  : currentTheme === 'landing'
                  ? '#ffffff'
                  : '#3b82f6';
                e.target.style.boxShadow = `0 0 0 3px ${
                  currentTheme === 'business' 
                    ? 'rgba(251,191,36,0.2)' 
                    : currentTheme === 'landing'
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(59,130,246,0.1)'
                }`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = currentTheme === 'business' 
                  ? 'rgba(251,191,36,0.3)' 
                  : currentTheme === 'landing'
                  ? 'rgba(255,255,255,0.3)'
                  : '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            
            {error && (
              <div style={{
                background: currentTheme === 'business' 
                  ? 'rgba(239,68,68,0.2)' 
                  : currentTheme === 'landing'
                  ? 'rgba(239,68,68,0.3)'
                  : '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                color: currentTheme === 'business' || currentTheme === 'landing' ? '#fecaca' : '#dc2626',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            
            <button 
              onClick={handleAnalyze}
              disabled={!bizno.trim()}
              style={{
                ...currentThemeStyles.button,
                width: '100%',
                opacity: bizno.trim() ? 1 : 0.5,
                cursor: bizno.trim() ? 'pointer' : 'not-allowed'
              }}
              onMouseOver={(e) => {
                if (bizno.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = currentTheme === 'business'
                    ? '0 12px 24px rgba(251,191,36,0.4)'
                    : currentTheme === 'landing'
                    ? '0 20px 40px rgba(0,0,0,0.3)'
                    : '0 8px 16px rgba(59,130,246,0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = currentTheme === 'business'
                  ? '0 8px 16px rgba(251,191,36,0.3)'
                  : currentTheme === 'landing'
                  ? '0 15px 30px rgba(0,0,0,0.2)'
                  : 'none';
              }}
            >
              {currentTheme === 'landing' && <span style={{ marginRight: '8px' }}>🚀</span>}
              세액공제 분석하기
            </button>
          </div>
            </div>

        {/* 샘플 데이터 */}
        <div style={currentThemeStyles.card}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'inherit'
          }}>
            📊 샘플 데이터로 체험하기
            {currentTheme === 'landing' && <span style={{ animation: 'bounce 2s infinite' }}>✨</span>}
          </h2>
          
          <p style={{ 
            marginBottom: '20px',
            color: 'inherit',
            opacity: 0.8,
            fontSize: '1rem'
          }}>
            실제 데이터 예시를 통해 시스템을 체험해보세요
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <button
              onClick={() => handleSampleAnalysis('1234567890', '좋은느낌')}
              style={currentThemeStyles.sampleButton}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                if (currentTheme === 'business') {
                  e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)';
                } else if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                if (currentTheme === 'business') {
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
                } else if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>좋은느낌</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>123-45-67890</div>
                </div>
                <span style={{
                  background: currentTheme === 'business' 
                    ? 'rgba(251,191,36,0.2)' 
                    : currentTheme === 'landing'
                    ? 'rgba(255,255,255,0.2)'
                    : '#e5e7eb',
                  color: currentTheme === 'business' || currentTheme === 'landing' ? 'white' : '#6b7280',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  샘플
                </span>
              </div>
            </button>

            <button
              onClick={() => handleSampleAnalysis('1018197530', '펜타플로')}
              style={currentThemeStyles.sampleButton}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                if (currentTheme === 'business') {
                  e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)';
                } else if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                if (currentTheme === 'business') {
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
                } else if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
                  >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>펜타플로</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>101-81-97530</div>
                      </div>
                <span style={{
                  background: currentTheme === 'business' 
                    ? 'rgba(251,191,36,0.2)' 
                    : currentTheme === 'landing'
                    ? 'rgba(255,255,255,0.2)'
                    : '#e5e7eb',
                  color: currentTheme === 'business' || currentTheme === 'landing' ? 'white' : '#6b7280',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  샘플
                </span>
                      </div>
            </button>
                      </div>
                    </div>

        {/* 주요 기능 소개 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          margin: '24px'
        }}>
          {[
            { icon: '💼', title: '고용증대세액공제', desc: '직전 연도 대비 고용 증대 시\n인당 70~120만원 세액공제' },
            { icon: '🛡️', title: '사회보험료세액공제', desc: '청년 100%, 일반 50%\n사회보험료 세액공제' },
            { icon: '📈', title: '사후관리 위험도', desc: '3년간 사후관리 기간\n인원 감소 시 환수 위험 분석' }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                ...currentThemeStyles.card,
                textAlign: 'center',
                margin: 0,
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (currentTheme === 'landing') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }
              }}
            >
              <div style={{ 
                fontSize: currentTheme === 'landing' ? '4rem' : '3rem', 
                marginBottom: '16px',
                filter: currentTheme === 'landing' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: 'inherit',
                fontSize: currentTheme === 'landing' ? '1.25rem' : '1.125rem'
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                color: 'inherit', 
                opacity: 0.8, 
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                fontSize: '0.95rem'
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
            </div>

        {/* 안내사항 */}
        <div style={{
          ...currentThemeStyles.card,
          margin: '24px'
        }}>
          <div style={{ color: 'inherit', opacity: 0.9 }}>
            <div style={{ 
              fontWeight: '600', 
              marginBottom: '16px', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📝 안내사항
            </div>
            <ul style={{ 
              paddingLeft: '20px', 
              lineHeight: '1.8', 
              fontSize: '0.95rem',
              margin: 0
            }}>
              <li>• 2024년 데이터는 약 60% 정확도를 가집니다</li>
              <li>• 실제 세액공제 신청 전 세무사와 상담을 권장합니다</li>
              <li>• 사후관리 기간(3년) 중 인원 감소 시 환수 위험이 있습니다</li>
              <li>• 경정청구 기한을 확인하여 적기에 신청하시기 바랍니다</li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div style={{
          textAlign: 'center',
          color: 'inherit',
          opacity: 0.6,
          fontSize: '0.9rem',
          padding: '40px 20px',
          borderTop: currentTheme === 'dashboard' ? '1px solid #e5e7eb' : 'none',
          marginTop: '20px'
        }}>
          <p>© 2024 세무 크레딧 분석 시스템. 정확한 세무 상담은 전문가와 진행하세요.</p>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
} 
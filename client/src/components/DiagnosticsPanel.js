import React, { useState, useEffect } from 'react';
import SpeechManager from '../utils/speechManager';

const styles = {
  panel: {
    position: 'fixed',
    bottom: '0',
    right: '0',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#00FF00',
    fontFamily: 'monospace',
    zIndex: 9999,
    border: '1px solid #00FF00',
    borderRadius: '5px 0 0 0',
    padding: '10px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    borderBottom: '1px solid #00FF00',
    paddingBottom: '5px',
  },
  title: {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#FF0000',
    cursor: 'pointer',
    fontSize: '16px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  tab: {
    padding: '5px 10px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    borderBottom: '2px solid #00FF00',
    fontWeight: 'bold',
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    padding: '5px',
  },
  logEntry: {
    margin: '2px 0',
    fontSize: '12px',
    lineHeight: '1.3',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  timestamp: {
    color: '#999',
    marginRight: '5px',
  },
  level: {
    marginRight: '5px',
  },
  info: { color: '#00FF00' },
  debug: { color: '#FFFFFF' },
  warn: { color: '#FFFF00' },
  error: { color: '#FF0000' },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '5px 0',
    fontSize: '12px',
  },
  metricLabel: {
    fontWeight: 'bold',
  },
  metricValue: {
    color: '#FFFFFF',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  button: {
    padding: '5px 10px',
    backgroundColor: '#333',
    color: '#00FF00',
    border: '1px solid #00FF00',
    cursor: 'pointer',
    fontSize: '12px',
  },
  helpContent: {
    color: '#CCCCCC',
    fontSize: '12px',
    lineHeight: '1.5',
    padding: '10px',
    overflow: 'auto',
  },
  helpSection: {
    marginBottom: '15px',
  },
  helpHeading: {
    color: '#00FF00',
    fontSize: '14px',
    marginBottom: '5px',
  },
  helpText: {
    margin: '5px 0',
  },
  shortcut: {
    backgroundColor: '#333',
    padding: '2px 6px',
    borderRadius: '3px',
    fontFamily: 'monospace',
  }
};

const DiagnosticsPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('logs');
  const [diagnosticData, setDiagnosticData] = useState({
    logs: [],
    metrics: {},
    status: {}
  });

  useEffect(() => {
    // Subscribe to diagnostic updates
    const unsubscribe = SpeechManager.subscribeToDiagnostics((data) => {
      setDiagnosticData({
        ...data,
        status: SpeechManager.getDiagnosticData().status
      });
    });

    // Initial data load
    setDiagnosticData(SpeechManager.getDiagnosticData());

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleResetDiagnostics = () => {
    SpeechManager.resetDiagnostics();
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Test speech functionality
  const handleTestSpeech = () => {
    SpeechManager.stopSpeech();
    SpeechManager.queueSpeech("Testing speech synthesis", SPEECH_CONFIG.LANGUAGES.ENGLISH, 1.0);
    SpeechManager.queueSpeech("测试中文语音合成", SPEECH_CONFIG.LANGUAGES.CHINESE, 1.0);
  };

  // Test word with spelling
  const handleTestWordSpelling = () => {
    SpeechManager.playWordWithSpelling("diagnostics");
  };

  // Test meaning pronunciation
  const handleTestMeaning = () => {
    SpeechManager.playMeaning({
      pos: "n.",
      meaning: "诊断工具 - A tool for analyzing system performance"
    });
  };

  const renderLogLevel = (level) => {
    return <span style={styles[level] || styles.debug}>{level.toUpperCase()}</span>;
  };

  const renderLogs = () => {
    return (
      <div style={styles.content}>
        {diagnosticData.logs.map((log, index) => (
          <div key={index} style={styles.logEntry}>
            <span style={styles.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span style={styles.level}>{renderLogLevel(log.level)}</span>
            <span>{log.message}</span>
            {log.data && (
              <div style={{ marginLeft: '10px', color: '#888' }}>
                {JSON.stringify(log.data)}
              </div>
            )}
          </div>
        ))}
        {diagnosticData.logs.length === 0 && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
            No logs recorded yet
          </div>
        )}
      </div>
    );
  };

  const renderMetrics = () => {
    const { metrics, status } = diagnosticData;

    return (
      <div style={styles.content}>
        <h4>Speech Metrics</h4>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Total Speech Requests:</span>
          <span style={styles.metricValue}>{metrics.totalSpeechRequests}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Successful Requests:</span>
          <span style={styles.metricValue}>{metrics.successfulSpeechRequests}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Failed Requests:</span>
          <span style={styles.metricValue}>{metrics.failedSpeechRequests}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Queue Overflows:</span>
          <span style={styles.metricValue}>{metrics.queueOverflows}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Average Queue Length:</span>
          <span style={styles.metricValue}>{metrics.averageQueueLength.toFixed(2)}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Average Speech Duration:</span>
          <span style={styles.metricValue}>{metrics.averageSpeechDuration.toFixed(2)} ms</span>
        </div>

        <h4>Speech Status</h4>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Current Queue Size:</span>
          <span style={styles.metricValue}>{status.queueSize || 0}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Is Speaking:</span>
          <span style={styles.metricValue}>{status.isSpeaking ? 'Yes' : 'No'}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Is Processing:</span>
          <span style={styles.metricValue}>{status.isProcessing ? 'Yes' : 'No'}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Voice Speed:</span>
          <span style={styles.metricValue}>{status.voiceSpeed?.toFixed(2) || 1.0}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Speech Available:</span>
          <span style={styles.metricValue}>{status.isAvailable ? 'Yes' : 'No'}</span>
        </div>
      </div>
    );
  };

  const renderHelp = () => {
    return (
      <div style={styles.helpContent}>
        <div style={styles.helpSection}>
          <h4 style={styles.helpHeading}>Speech Diagnostics Panel</h4>
          <p style={styles.helpText}>
            This panel provides debugging information and controls for the speech synthesis system.
          </p>
        </div>
        
        <div style={styles.helpSection}>
          <h4 style={styles.helpHeading}>How to Show/Hide</h4>
          <ul>
            <li>Triple-click anywhere on the screen to toggle</li>
            <li>Press <span style={styles.shortcut}>Ctrl+Shift+D</span> to toggle</li>
          </ul>
        </div>
        
        <div style={styles.helpSection}>
          <h4 style={styles.helpHeading}>Tabs</h4>
          <ul>
            <li><strong>Logs</strong> - Shows speech events and errors</li>
            <li><strong>Metrics</strong> - Shows statistics and current status</li>
            <li><strong>Help</strong> - This help information</li>
          </ul>
        </div>
        
        <div style={styles.helpSection}>
          <h4 style={styles.helpHeading}>Test Tools</h4>
          <p style={styles.helpText}>
            Use the test buttons at the bottom to verify different speech functions:
          </p>
          <ul>
            <li><strong>Basic Test</strong> - Tests simple speech in English and Chinese</li>
            <li><strong>Word+Spelling</strong> - Tests word pronunciation with letter-by-letter spelling</li>
            <li><strong>Test POS+Meaning</strong> - Tests part-of-speech and bilingual meaning pronunciation</li>
          </ul>
        </div>
        
        <div style={styles.helpSection}>
          <h4 style={styles.helpHeading}>Log Levels</h4>
          <ul>
            <li style={{color: styles.info.color}}><strong>INFO</strong> - Normal operations</li>
            <li style={{color: styles.debug.color}}><strong>DEBUG</strong> - Detailed operation information</li>
            <li style={{color: styles.warn.color}}><strong>WARN</strong> - Potential issues</li>
            <li style={{color: styles.error.color}}><strong>ERROR</strong> - Operation failures</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Speech Manager Diagnostics</h3>
        <button style={styles.closeButton} onClick={onClose}>×</button>
      </div>
      <div style={styles.tabs}>
        <div
          style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.activeTab : {}) }}
          onClick={() => handleTabClick('logs')}
        >
          Logs
        </div>
        <div
          style={{ ...styles.tab, ...(activeTab === 'metrics' ? styles.activeTab : {}) }}
          onClick={() => handleTabClick('metrics')}
        >
          Metrics
        </div>
        <div
          style={{ ...styles.tab, ...(activeTab === 'help' ? styles.activeTab : {}) }}
          onClick={() => handleTabClick('help')}
        >
          Help
        </div>
      </div>
      
      {activeTab === 'logs' && renderLogs()}
      {activeTab === 'metrics' && renderMetrics()}
      {activeTab === 'help' && renderHelp()}
      
      <div style={styles.buttons}>
        <button style={styles.button} onClick={handleResetDiagnostics}>
          Reset Diagnostics
        </button>
        <button style={styles.button} onClick={() => SpeechManager.stopSpeech()}>
          Stop Speech
        </button>
      </div>
      
      <div style={{...styles.buttons, borderTop: '1px solid #00FF00', paddingTop: '10px', marginTop: '5px'}}>
        <p style={{color: '#00FF00', fontSize: '12px', margin: '0 0 5px 0'}}>Speech Tests:</p>
        <button style={styles.button} onClick={handleTestSpeech}>
          Basic Test
        </button>
        <button style={styles.button} onClick={handleTestWordSpelling}>
          Word+Spelling
        </button>
        <button style={styles.button} onClick={handleTestMeaning}>
          Test POS+Meaning
        </button>
      </div>
    </div>
  );
};

export default DiagnosticsPanel; 
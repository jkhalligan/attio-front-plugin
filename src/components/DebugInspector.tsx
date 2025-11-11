import React, { useState } from 'react';

interface DebugInspectorProps {
  data: any;
  label: string;
}

export const DebugInspector: React.FC<DebugInspectorProps> = ({ data, label }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded

  if (!data) {
    return (
      <div style={{ 
        padding: '8px', 
        margin: '8px 0', 
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px',
        fontSize: '13px'
      }}>
        <strong>⚠️ {label}:</strong> No data found
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '10px', 
      margin: '10px 0', 
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      fontSize: '13px'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          padding: '4px 0'
        }}
      >
        {isExpanded ? '▼' : '▶'} {label}
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          {/* Top-level properties */}
          <div style={{ 
            marginBottom: '12px',
            padding: '8px',
            background: '#fff',
            borderRadius: '3px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
              📋 Top-level properties:
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.6' }}>
              <div>• record_text: <strong>{data.record_text || '❌ Missing'}</strong></div>
              <div>• record_image: {data.record_image ? '✅ Has image' : '❌ No image'}</div>
              <div>• web_url: {data.web_url ? '✅ Has URL' : '❌ No URL'}</div>
              <div>• id: {data.id?.record_id ? `✅ ${data.id.record_id.substring(0, 12)}...` : '❌ Missing'}</div>
            </div>
          </div>

          {/* Values attributes */}
          {data.values && Object.keys(data.values).length > 0 ? (
            <div style={{ 
              padding: '8px',
              background: '#fff',
              borderRadius: '3px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                🔍 Attributes ({Object.keys(data.values).length} total):
              </div>
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                fontSize: '11px'
              }}>
                {Object.entries(data.values)
                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                  .map(([key, value]: [string, any]) => {
                    const valueArray = Array.isArray(value) ? value : [];
                    const hasData = valueArray.length > 0;
                    const activeValue = valueArray.find(v => v.active_until === null) || valueArray[0];
                    
                    return (
                      <div 
                        key={key} 
                        style={{ 
                          padding: '6px 8px', 
                          background: hasData ? '#d4edda' : '#f8d7da',
                          margin: '3px 0',
                          borderRadius: '3px',
                          borderLeft: `3px solid ${hasData ? '#28a745' : '#dc3545'}`
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {hasData ? '✅' : '❌'} {key}
                          {hasData && (
                            <span style={{ 
                              marginLeft: '6px', 
                              fontWeight: 'normal',
                              color: '#666'
                            }}>
                              ({valueArray.length} value{valueArray.length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        
                        {hasData && activeValue && (
                          <div style={{ 
                            marginLeft: '20px', 
                            marginTop: '4px',
                            color: '#555',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            background: 'rgba(255,255,255,0.5)',
                            padding: '3px 6px',
                            borderRadius: '2px'
                          }}>
                            {/* Show the actual value based on type */}
                            {activeValue.value !== undefined && (
                              <div>
                                💬 value: <strong>{
                                  typeof activeValue.value === 'string' 
                                    ? `"${activeValue.value}"` 
                                    : JSON.stringify(activeValue.value)
                                }</strong>
                              </div>
                            )}
                            {activeValue.target_record_id && (
                              <div>
                                🔗 references: <strong>{activeValue.target_record_id.substring(0, 12)}...</strong>
                                {activeValue.target_object && ` (${activeValue.target_object})`}
                              </div>
                            )}
                            {activeValue.status_id && (
                              <div>📊 status_id: <strong>{activeValue.status_id}</strong></div>
                            )}
                            {activeValue.option_id && (
                              <div>📋 option_id: <strong>{activeValue.option_id}</strong></div>
                            )}
                            {activeValue.currency_code && (
                              <div>💰 currency: <strong>{activeValue.currency_code}</strong></div>
                            )}
                          </div>
                        )}
                        
                        {!hasData && (
                          <div style={{ 
                            marginLeft: '20px',
                            marginTop: '2px',
                            color: '#856404',
                            fontStyle: 'italic'
                          }}>
                            Empty array - no values set
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '8px',
              background: '#fff3cd',
              borderRadius: '3px',
              color: '#856404'
            }}>
              ⚠️ No 'values' object found or it's empty
            </div>
          )}

          {/* Raw JSON toggle */}
          <details style={{ marginTop: '12px', fontSize: '10px' }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontWeight: 'bold',
              padding: '6px',
              background: '#e9ecef',
              borderRadius: '3px'
            }}>
              📄 View Raw JSON
            </summary>
            <pre style={{ 
              background: '#fff', 
              padding: '10px', 
              overflow: 'auto',
              maxHeight: '300px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              fontSize: '9px',
              lineHeight: '1.4'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

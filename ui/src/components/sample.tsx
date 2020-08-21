import React from 'react';

function Sample() {
  return (
    <div>
      <div style={{
        display: "inline-block",
        marginTop: "6px"
      }}>
        Incorrect format
      </div>

      <div style={{ display: 'inline-block', marginTop: '6px' }}>
        Correct format
      </div>
    </div>
  );
}
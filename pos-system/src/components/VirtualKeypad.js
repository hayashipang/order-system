import React from 'react';

const VirtualKeypad = ({ onKeyPress, onClear, onBackspace }) => {
  const handleKeyClick = (key) => {
    onKeyPress(key);
  };

  const handleClearClick = () => {
    onClear();
  };

  const handleBackspaceClick = () => {
    onBackspace();
  };

  return (
    <div className="virtual-keypad">
      <div className="keypad-row">
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('7')}
        >
          7
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('8')}
        >
          8
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('9')}
        >
          9
        </button>
      </div>
      <div className="keypad-row">
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('4')}
        >
          4
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('5')}
        >
          5
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('6')}
        >
          6
        </button>
      </div>
      <div className="keypad-row">
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('1')}
        >
          1
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('2')}
        >
          2
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('3')}
        >
          3
        </button>
      </div>
      <div className="keypad-row">
        <button 
          className="keypad-btn keypad-btn-clear" 
          onClick={handleClearClick}
        >
          C
        </button>
        <button 
          className="keypad-btn" 
          onClick={() => handleKeyClick('0')}
        >
          0
        </button>
        <button 
          className="keypad-btn keypad-btn-backspace" 
          onClick={handleBackspaceClick}
        >
          ⌫
        </button>
      </div>
    </div>
  );
};

export default VirtualKeypad;

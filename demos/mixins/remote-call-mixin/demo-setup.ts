// Demo Setup Module
// Handles component creation and initialization for the remote-call demo

// Remove all mixin imports and usage. Only mixin elements are used now.
// (No import { RemoteCallCallerMixin } ...)
// (No import { RemoteCallReceiverMixin } ...)

// The rest of your setup code can remain as is, as long as it only interacts with <remote-call-caller-mixin> and <remote-call-receiver-mixin> elements.

// If there was any code that defined custom elements using the mixins, remove it.
// If you have any initialization or utility code for the demo, keep it below.

// Example: (keep your actual demo setup code here)
// ... existing code ...

// Register custom elements
// customElements.define('demo-caller', DemoCaller);
// customElements.define('demo-receiver', DemoReceiver);

// Global functions for demo controls
function getCallerMixin() {
  return document.querySelector('remote-call-caller-mixin');
}

window.callIncrement = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote(receiverId, 'increment');
    logCaller(`Called increment() on ${receiverId}`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callDecrement = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote(receiverId, 'decrement');
    logCaller(`Called decrement() on ${receiverId}`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callSetCounter = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    const randomValue = Math.floor(Math.random() * 100);
    caller.callRemote(receiverId, 'setCounter', randomValue);
    logCaller(`Called setCounter(${randomValue}) on ${receiverId}`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callChangeColor = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    caller.callRemote(receiverId, 'changeColor', randomColor);
    logCaller(`Called changeColor(${randomColor}) on ${receiverId}`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callSetText = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    const messages = [
      'Hello from caller!',
      'Remote call successful!',
      'Component communication works!',
      'Mixins are awesome!',
      'Decoupled architecture!'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    caller.callRemote(receiverId, 'setText', randomMessage);
    logCaller(`Called setText("${randomMessage}") on ${receiverId}`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callPrivateMethod = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote(receiverId, '_privateMethod');
    logCaller(`Attempted to call private method on ${receiverId} (should fail)`, 'warning');
  } else {
    console.error('Caller component not found');
  }
};

window.callNonExistentMethod = function (receiverId) {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote(receiverId, 'nonExistentMethod');
    logCaller(`Attempted to call non-existent method on ${receiverId} (should fail)`, 'warning');
  } else {
    console.error('Caller component not found');
  }
};

window.clearReceiverLog = function () {
  const logElement = document.getElementById('receiverLog');
  if (logElement) {
    logElement.innerHTML = '<div class="log-entry info">Log cleared</div>';
  }
};

// Call Both functions
window.callIncrementBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote('demo-receiver-1', 'increment');
    caller.callRemote('demo-receiver-2', 'increment');
    logCaller('Called increment() on both receivers', 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callDecrementBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote('demo-receiver-1', 'decrement');
    caller.callRemote('demo-receiver-2', 'decrement');
    logCaller('Called decrement() on both receivers', 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callSetCounterBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    const randomValue = Math.floor(Math.random() * 100);
    caller.callRemote('demo-receiver-1', 'setCounter', randomValue);
    caller.callRemote('demo-receiver-2', 'setCounter', randomValue);
    logCaller(`Called setCounter(${randomValue}) on both receivers`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callChangeColorBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    caller.callRemote('demo-receiver-1', 'changeColor', randomColor);
    caller.callRemote('demo-receiver-2', 'changeColor', randomColor);
    logCaller(`Called changeColor(${randomColor}) on both receivers`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callSetTextBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    const messages = [
      'Hello from caller!',
      'Remote call successful!',
      'Component communication works!',
      'Mixins are awesome!',
      'Decoupled architecture!'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    caller.callRemote('demo-receiver-1', 'setText', randomMessage);
    caller.callRemote('demo-receiver-2', 'setText', randomMessage);
    logCaller(`Called setText("${randomMessage}") on both receivers`, 'info');
  } else {
    console.error('Caller component not found');
  }
};

window.callPrivateMethodBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote('demo-receiver-1', '_privateMethod');
    caller.callRemote('demo-receiver-2', '_privateMethod');
    logCaller('Attempted to call private method on both receivers (should fail)', 'warning');
  } else {
    console.error('Caller component not found');
  }
};

window.callNonExistentMethodBoth = function () {
  const caller = getCallerMixin();
  if (caller) {
    caller.callRemote('demo-receiver-1', 'nonExistentMethod');
    caller.callRemote('demo-receiver-2', 'nonExistentMethod');
    logCaller('Attempted to call non-existent method on both receivers (should fail)', 'warning');
  } else {
    console.error('Caller component not found');
  }
};

function logCaller(message, type = 'info') {
  const logEl = document.getElementById('callerLog');
  if (logEl) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }
  console[type === 'error' ? 'error' : 'log']('[RemoteCallCallerMixin]', message);
}

// Initialize demo components
export function initializeDemo() {
  console.log('🔧 initializeDemo() called');

  // Create the caller component only if not present
  const callerContainer = document.querySelector('.caller-panel');
  if (callerContainer && !callerContainer.querySelector('remote-call-caller-mixin')) {
    const caller = document.createElement('remote-call-caller-mixin');
    caller.id = 'demo-caller-1';
    callerContainer.appendChild(caller);
    console.log('✅ Caller component created and added');
  }

  // Receivers are now created declaratively in the HTML fragment
  console.log('📥 Receivers are created declaratively in the HTML fragment');

  // Log all receivers in the DOM to verify they exist
  const allReceivers = document.querySelectorAll('demo-receiver');
  console.log('📊 Total demo-receiver elements in DOM:', allReceivers.length);
  allReceivers.forEach((rec, i) => {
    console.log(`📱 Receiver ${i + 1}:`, rec, 'ID:', rec.id, 'Parent:', rec.parentElement);
  });

  // Log all Mixins in the DOM
      const allMixins = document.querySelectorAll('remote-call-receiver-mixin');
    console.log('📦 Total remote-call-receiver-mixin elements in DOM:', allMixins.length);
  allMixins.forEach((wrap, i) => {
    console.log(`📦 Mixin ${i + 1}:`, wrap, 'ID:', wrap.id, 'Children:', wrap.children.length);
  });

  // Update connection status
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const connectionStatus = document.getElementById('connectionStatus');

  if (statusIndicator && statusText && connectionStatus) {
    statusIndicator.className = 'status-indicator active';
    statusText.textContent = 'Components connected and ready';
    connectionStatus.className = 'connection-status connected';
    console.log('✅ Connection status updated');
  }
}

window.resetReceiver = function () {
  const receivers = document.querySelectorAll('demo-receiver');
  receivers.forEach(receiver => {
    receiver.counter = 0;
    receiver.color = '#667eea';
    receiver.text = 'Waiting for remote calls...';
    receiver.updateDisplay();
  });
  // single log entry
  const logElement = document.getElementById('receiverLog');
  if (logElement) {
    const entry = document.createElement('div');
    entry.className = 'log-entry info';
    entry.textContent = 'All receivers reset to initial state';
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }
};

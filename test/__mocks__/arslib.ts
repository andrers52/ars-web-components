// Mock for arslib dependency

// Mock Assert
export const Assert = {
  assert: (condition, message) => {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
};

// Mock EObject
export const EObject = {
  hasSameProperties: (obj1, obj2) => {
    if (!obj1 || !obj2) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => obj1[key] === obj2[key]);
  }
};

// Mock EArray
export const EArray = {
  choice: (arr) => {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

// Default export with all utilities
export default {
  Assert,
  EObject,
  EArray
};
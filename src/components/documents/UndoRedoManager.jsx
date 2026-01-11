// Simple Undo/Redo Manager for Template Editor
export class UndoRedoManager {
  constructor(initialState) {
    this.history = [initialState];
    this.currentIndex = 0;
    this.listeners = [];
  }

  // Push new state to history
  push(state) {
    // Remove any redo history when new change is made
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(state);
    this.currentIndex += 1;
    this.notifyListeners();
  }

  // Undo to previous state
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this.notifyListeners();
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Redo to next state
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex += 1;
      this.notifyListeners();
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Get current state
  getCurrentState() {
    return this.history[this.currentIndex];
  }

  // Check if can undo
  canUndo() {
    return this.currentIndex > 0;
  }

  // Check if can redo
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Reset to initial state
  reset(initialState) {
    this.history = [initialState];
    this.currentIndex = 0;
    this.notifyListeners();
  }
}
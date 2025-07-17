// Sequencer utility: queues and runs async actions in order

export default class Sequencer {
  constructor() {
    this.queue = [];
    this.running = false;
  }

  // Add an async function (should return a Promise)
  add(action) {
    this.queue.push(action);
    if (!this.running) {
      this.run();
    }
  }

  // Add multiple actions at once
  addMany(actions) {
    this.queue.push(...actions);
    if (!this.running) {
      this.run();
    }
  }

  // Run the queue
  async run() {
    this.running = true;
    while (this.queue.length > 0) {
      const action = this.queue.shift();
      try {
        await action();
      } catch (e) {
        // Optionally handle errors here
        console.error('Sequencer action error:', e);
      }
    }
    this.running = false;
  }

  // Clear the queue
  clear() {
    this.queue = [];
    this.running = false;
  }
} 
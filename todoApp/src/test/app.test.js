describe('Message Change', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <p id="message">Hello, World!</p>
        <button id="changeMessage">Change Message</button>
      `;
    });
  
    test('should change message when button is clicked', () => {
      const messageElement = document.getElementById('message');
      const button = document.getElementById('changeMessage');
  
      button.click();
      expect(messageElement.textContent).toBe('Message Changed!');
    });
  });
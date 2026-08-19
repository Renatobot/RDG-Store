try {
  const app = require('../index.js');
  module.exports = app;
} catch (error) {
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: 'Initialization Error', 
      name: error.name,
      message: error.message, 
      stack: error.stack 
    });
  };
}

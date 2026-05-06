export const setupProctorSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`¡Un estudiante conectado! Socket ID: ${socket.id}`);

    // Listen for tab switching or loss of focus
    socket.on('integrity_violation', (data) => {
      console.warn(`🚨 CHEATING ALERT from user ${data.studentId}: ${data.type}`);
      // Here you would log this to a ProctorLog database collection
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
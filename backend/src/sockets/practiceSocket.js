export const setupPracticeSockets = (io) => {
  const practiceNamespace = io.of('/practice');

  practiceNamespace.on('connection', (socket) => {
    console.log(`🔌 [Practice] Client connected: ${socket.id}`);

    socket.on('join_sheet', (data) => {
      const { sheetId, role } = data;
      socket.join(`sheet_${sheetId}`);
      console.log(`🔌 [Practice] ${role} joined sheet room: sheet_${sheetId}`);
    });

    socket.on('leave_sheet', (data) => {
      const { sheetId } = data;
      socket.leave(`sheet_${sheetId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Practice] Disconnected: ${socket.id}`);
    });
  });

  return practiceNamespace;
};

let ioInstance = null;
export const setPracticeIO = (io) => { ioInstance = io.of('/practice'); };
export const getPracticeIO = () => ioInstance;

import app from './api/index';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 GizmoTek API Backend running on http://localhost:${PORT}`);
});
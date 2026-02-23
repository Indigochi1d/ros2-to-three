import URDFLoader, { URDFRobot } from 'urdf-loader';

export async function loadRobot(urdfUrl: string): Promise<URDFRobot> {
  const loader = new URDFLoader();
  return loader.loadAsync(urdfUrl);
}

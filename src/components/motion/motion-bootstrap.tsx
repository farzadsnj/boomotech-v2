export const motionBootstrapScript =
  "document.documentElement.classList.add('motion-enabled')";

export function MotionBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: motionBootstrapScript }} />;
}

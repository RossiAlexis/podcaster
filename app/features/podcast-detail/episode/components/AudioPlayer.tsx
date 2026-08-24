export function AudioPlayer({ src }: { src: string }) {
  return <audio className="mt-6 w-full" controls src={src} />;
}

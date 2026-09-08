export function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
}

export function isAudioFile(file: File) {
  return (
    file.type.startsWith("audio/") ||
    /\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name)
  );
}

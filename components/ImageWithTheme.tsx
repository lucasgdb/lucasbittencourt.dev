import Image, { type ImageProps } from 'next/image';
import { useTheme } from 'next-themes';

type ImageWithThemeProps = ImageProps & {
  light?: string;
  dark?: string;
};

export default function ImageWithTheme(props: ImageWithThemeProps) {
  const { theme } = useTheme();

  return <Image alt={props.alt} src={theme === 'light' ? props.light : props.dark} {...props} />;
}

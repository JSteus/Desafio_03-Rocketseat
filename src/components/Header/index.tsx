import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.head}>
      <Link href="/">
        <a>
          <img src="/images/Logo.png" alt="logo" />
        </a>
      </Link>
    </header>
  );
}

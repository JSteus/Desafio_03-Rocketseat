import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { createClient } from '../services/prismic';
import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { PrismicDocument, Query } from '@prismicio/types';
import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function parseData(postsResponse: Query) {
  const parsed = postsResponse.results.map((post: PrismicDocument) => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ).toLocaleUpperCase(),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  return parsed;
}

export default function Home({
  postsPagination: { results, next_page },
}: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string | null>(next_page);

  const handleLoadPosts = async () => {
    const postResponse = await fetch(next_page).then(res => res.json());
    const results = parseData(postResponse);
    setPosts(posts => [...posts, ...results]);
    setNextPage(postResponse.next_page);
  };

  return (
    <>
      <Head>
        <title> Posts | spacetraveling </title>
      </Head>
      <main className={styles.container}>
        <Header />
        {posts.map((item, index) => (
          <Link key={`${item.uid}-${index}`} href={`/post/${item.uid}`}>
            <a>
              <h3 className={commonStyles.heading}>{item.data.title}</h3>
              <p className={commonStyles.paragraph}>{item.data.subtitle}</p>
              <div className={commonStyles.info}>
                <span>
                  <FiCalendar />
                  <p>{item.first_publication_date}</p>
                </span>
                <span>
                  <FiUser />
                  <p>{item.data.author}</p>
                </span>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button onClick={() => handleLoadPosts()}>Carregar mais posts</button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  previewData,
}) => {
  const client = createClient({ previewData });
  const postsResponse = await client.getByType('posts', { pageSize: 3 });

  const results = parseData(postsResponse);

  return {
    props: {
      postsPagination: {
        results: results,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 60 * 48,
  };
};

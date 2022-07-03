import { GetStaticPaths, GetStaticProps } from 'next';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { createClient } from '../../services/prismic';
import { PrismicDocument } from '@prismicio/types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Header from '../../components/Header';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

function parseData(postsResponse: PrismicDocument) {
  const parsedPost = {
    first_publication_date: format(
      new Date(postsResponse.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ).toLocaleUpperCase(),
    data: {
      title: postsResponse.data.title,
      banner: {
        url: postsResponse.data.banner.url,
      },
      author: postsResponse.data.author,
      content: postsResponse.data.slices.map(
        (slice: {
          primary: { heading: string; body: { text: string }[] };
        }) => ({
          heading: slice.primary.heading,
          body: slice.primary.body[0].text,
        })
      ),
    },
  };

  return parsedPost;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) return <h2>Carregando...</h2>;

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={commonStyles.info}>
          <span>
            <FiCalendar />
            <p>{post.first_publication_date}</p>
          </span>
          <span>
            <FiUser />
            <p>{post.data.author}</p>
          </span>
          <span>
            <FiClock />
            <p>
              {Math.ceil(
                post.data.content.reduce((total, content) => {
                  total += content.body.match(/\S+\s*/g).length;
                  return total;
                }, 0) / 200
              )}{' '}
              min
            </p>
          </span>
        </div>
        {post.data.content.map((item, i) => (
          <section key={i}>
            <h3 className={commonStyles.heading}>{item.heading}</h3>
            <p className={commonStyles.paragraph}>{item.body}</p>
          </section>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = createClient();
  const response = await prismic.getByType('posts');

  const slugs = response.results.map(post => ({ params: { slug: post.uid } }));
  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps = async ({ params: { slug }, previewData }) => {
  const prismic = createClient({ previewData });
  const response = await prismic.getByUID('posts', String(slug));
  const post = parseData(response);

  return {
    props: { post },
    revalidate: 60 * 60 * 48,
  };
};

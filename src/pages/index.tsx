import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Loading } from "../icons/loading";
import { Logo } from "../icons/Logo";

import { trpc } from "../utils/trpc";

const Messages = () => {
  const { data: messages, isLoading } = trpc.guestbook.getAll.useQuery();
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="mb-2 h-[1rem] w-[12rem] animate-pulse rounded-full bg-white/20" />
        <div className="h-[1rem] w-[4rem] animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {messages?.map((msg, idx) => (
        <div key={idx} className="border-b border-neutral-500/50 pb-3 md:pb-6">
          <h3>{msg.message}</h3>
          <p className="text-xs font-light italic">- {msg.name}</p>
        </div>
      ))}
    </div>
  );
};

const Form = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { data: session } = useSession();
  const utils = trpc.useContext();
  const postMessage = trpc.guestbook.postMessage.useMutation({
    onMutate: () => {
      utils.guestbook.getAll.cancel();
      const optimisticUpdate = utils.guestbook.getAll.getData();

      if (optimisticUpdate) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        utils.guestbook.getAll.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.guestbook.getAll.invalidate();
      setLoading(false);
    },
  });

  return (
    <form
      className="flex space-x-3"
      onSubmit={(event) => {
        event.preventDefault();
        setLoading(true);
        session &&
          postMessage.mutate({
            name: session.user?.name as string,
            message,
          });
        setMessage("");
      }}
    >
      <input
        type="text"
        className="rounded-md border border-neutral-500 bg-transparent p-2 text-sm outline-none placeholder:text-neutral-400/30 focus:border-indigo-600 focus:outline-none"
        name="message"
        placeholder="Your message ..."
        minLength={2}
        maxLength={100}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-indigo-500 px-4 py-1 text-sm"
      >
        {loading && <Loading className="mr-2 animate-spin" />}
        Submit
      </button>
    </form>
  );
};

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const [loadingSpinner, setLoadingSpinner] = useState(false);

  if (status === "loading") {
    return <main>Loading...</main>;
  }

  return (
    <>
      <Head>
        <title>Guestbook - v3n0m</title>
      </Head>
      <main className="container mx-auto flex max-w-3xl flex-col pt-20">
        <Logo className="h-12 w-12" />
        <h1 className="mb-6 inline-block text-2xl font-bold">Guestbook</h1>
        <div className="mb-10">
          {session ? (
            <>
              <div className="mb-10 flex space-x-6">
                <Image
                  src={session.user?.image ?? ""}
                  className="rounded-full"
                  width="70"
                  height="70"
                  alt="user"
                />
                <div className="flex flex-col justify-start space-y-2">
                  <h3>Hi, {session.user?.name}</h3>
                  <button
                    onClick={() => {
                      setLoadingSpinner(true);
                      signOut();
                    }}
                    className="inline-flex items-center rounded bg-red-400 px-4 py-2 text-sm"
                  >
                    {loadingSpinner && (
                      <Loading className="mr-2 animate-spin" />
                    )}
                    Logout
                  </button>
                </div>
              </div>
              {/* Form  */}
              <Form />
            </>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="inline-block max-w-fit rounded bg-indigo-600 px-4 py-2 text-sm"
            >
              Login With Discord
            </button>
          )}
        </div>

        {/* messages */}
        <Messages />
      </main>
    </>
  );
};

export default Home;

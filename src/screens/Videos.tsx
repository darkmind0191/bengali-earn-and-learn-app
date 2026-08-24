import { PlayCircle, ExternalLink } from 'lucide-react';

const videos = [
  {
    title: 'ইংরেজি শেখার সহজ উপায়',
    channel: 'Learn Bangla',
    url: 'https://www.youtube.com/watch?v=HfTXHrWMGVY',
    thumbnail: 'https://img.youtube.com/vi/HfTXHrWMGVY/hqdefault.jpg',
  },
  {
    title: 'প্রতিদিন ১০ মিনিট ইংরেজি',
    channel: 'Learn Bangla',
    url: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0',
    thumbnail: 'https://img.youtube.com/vi/V-_O7nl0Ii0/hqdefault.jpg',
  },
  {
    title: 'বাংলা থেকে ইংরেজি কথা বলা',
    channel: 'Learn Bangla',
    url: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g',
    thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
  },
];

export default function Videos() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PlayCircle className="text-brand-600 dark:text-brand-400" />
          ভিডিও শিখুন
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          প্রতিদিন নতুন কিছু শিখুন
        </p>
      </div>

      {videos.map((video) => (
        <div
          key={video.url}
          className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />

          <div className="p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {video.title}
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {video.channel}
            </p>

            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition"
            >
              <PlayCircle size={18} />
              ভিডিও দেখুন
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
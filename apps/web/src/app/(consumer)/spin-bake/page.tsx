import { notFound } from 'next/navigation'
import { ConsumerScreen } from "@/consumer/ConsumerScreen";
export default function Page() { if (process.env.NODE_ENV === 'production') notFound(); return <ConsumerScreen screen="SpinBake" />; }

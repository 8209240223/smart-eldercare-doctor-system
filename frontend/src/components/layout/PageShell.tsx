import { motion } from "motion/react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface PageShellProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  backgroundImage,
  children,
  rightPanel,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-medical-50/30">
      {/* 页面背景图 */}
      {backgroundImage && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
      )}
      <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-transparent to-medical-50/20" />

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="relative min-h-screen p-4 lg:ml-[240px] lg:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <Header title={title} subtitle={subtitle} />

          <div className="flex gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="min-w-0 flex-1"
            >
              {children}
            </motion.div>

            {rightPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="hidden w-[360px] shrink-0 xl:block"
              >
                {rightPanel}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

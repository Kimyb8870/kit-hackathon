import type { Metadata } from "next";
import { LmsHeader } from "@/components/lms/lms-header";
import { CrossAgentToast } from "@/components/cross-agent/cross-agent-toast";
import "./lms.css";

export const metadata: Metadata = {
  title: "EduMall — 배움의 모든 것",
  description: "관심 있는 주제, 지금 시작해 보세요. EduMall에서.",
};

export default function LmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lms-root flex flex-1 flex-col">
      <LmsHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <CrossAgentToast forRole="all" />
      <footer className="mt-16 border-t border-[#ececec] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 text-[12px] text-[#8a8d92]">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-bold text-[#1f1f1f]">EduMall</span>
            <span className="text-[10px]">에듀몰 (sample LMS)</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <span>회사소개</span>
            <span>이용약관</span>
            <span>개인정보처리방침</span>
            <span>강사 모집</span>
            <span>1:1 문의</span>
          </div>
          <p className="text-[11px] text-[#a8abb0]">
            © 2026 EduMall. 본 페이지는 KIT 바이브코딩 공모전 데모용 가짜 LMS
            컨테이너이며, Clover 3-Agent가 iframe으로 임베딩되어 동작하는
            모습을 보여주기 위한 목적으로 제작되었습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}

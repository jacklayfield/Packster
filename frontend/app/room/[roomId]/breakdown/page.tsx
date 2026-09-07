"use client";

import { use } from "react";
import CostBreakdown from "@/components/CostBreakdown";

type ParamsType = Promise<{ roomId: string }>;

export default function BreakdownPage({ params }: { params: ParamsType }) {
    const { roomId } = use(params);
    return <CostBreakdown roomId={roomId} />;
}
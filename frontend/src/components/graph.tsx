import type { FC } from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const calculateChartHeight = (dataLength: number) => {
    // Base height: 320px, add 15px for each data point to accommodate rotated labels
    return Math.max(320, 320 + (dataLength - 1) * 15);
};

export type GraphPoint = {
    name: string;
    amount: number;
};

type Props = {
    graphData: GraphPoint[];
    headerText: string;
}

type CustomTickProps = {
    x?: number;
    y?: number;
    payload?: {
        value: string;
    };
};

export const defaultGraphData: [GraphPoint] = [{ name: "", amount: 0 },];

const CustomXAxisTick: FC<CustomTickProps> = ({ x = 0, y = 0, payload }) => {
    if (!payload) return null;

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="end"
            transform={`rotate(-55, ${x}, ${y})`}
            dy={10}
        >
            {payload.value}
        </text>
    );
};

export const Graph: FC<Props> = ({
    graphData,
    headerText
}) => {
    return (
        <div className="mt-8 w-100 px-4 flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold text-white-600">
                {headerText}
            </h2>
            <ResponsiveContainer
                width="100%"
                height={calculateChartHeight(graphData.length)}
            >
                <LineChart
                    data={graphData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 80 }}
                >
                    <XAxis
                        dataKey="name"
                        interval={0}
                        height={60}
                        tick={<CustomXAxisTick />}
                    />

                    <YAxis
                        width={60}
                        tick={{
                            fill: "#ffffff",
                        }}
                    />

                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={{ fill: "#ffffff" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
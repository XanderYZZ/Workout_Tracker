import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { apiClient } from "../lib/apiclient";
import { Navbar } from "../components/navbar.tsx";

const Reports: FC = () => {
    return (
        <div className="background-primary">
            <Navbar></Navbar>
        </div>
    );
}

export default Reports;
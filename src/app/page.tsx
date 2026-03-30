'use client';

import { useEffect, useState } from 'react';

type Device = {
  deviceId: string;
  deviceSerial: string;
  deviceModel: string;
  osVersion: string;
  enrolled: boolean;
  enrolledAt?: string;
  lastSeenAt?: string;
};

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const adminApiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

  useEffect(() => {
    async function loadDevices() {
      try {
        if (!adminApiKey) {
          throw new Error('NEXT_PUBLIC_ADMIN_API_KEY is not configured');
        }

        const res = await fetch('/api/admin/devices', {
          headers: {
            'X-API-Key': adminApiKey,
          },
        });

        if (!res.ok) {
          throw new Error(`Device query failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setDevices(data.devices || data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadDevices();
  }, [adminApiKey]);

  return (
    <main className="min-h-screen bg-neutral-900 text-white px-4 py-8">
      <div className="mx-auto max-w-5xl rounded-lg border border-neutral-700 bg-neutral-950 p-6">
        <h1 className="mb-4 text-4xl font-bold">EnterpriseShell Admin Dashboard</h1>

        {loading && <p>Loading devices...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}

        {!loading && !error && (
          <>
            <p className="mb-3 text-sm text-neutral-300">Total devices: {devices.length}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-700 text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Serial</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">OS</th>
                    <th className="px-3 py-2">Enrolled</th>
                    <th className="px-3 py-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {devices.length === 0 && (
                    <tr>
                      <td className="px-3 py-2" colSpan={6}>
                        No devices found.
                      </td>
                    </tr>
                  )}
                  {devices.map((device) => (
                    <tr key={device.deviceId}>
                      <td className="px-3 py-2">{device.deviceId}</td>
                      <td className="px-3 py-2">{device.deviceSerial}</td>
                      <td className="px-3 py-2">{device.deviceModel}</td>
                      <td className="px-3 py-2">{device.osVersion}</td>
                      <td className="px-3 py-2">{device.enrolled ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

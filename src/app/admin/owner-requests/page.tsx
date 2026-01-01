'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PromotionRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  propertyTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reason?: string;
}

export default function OwnerPromotionRequests() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? '' : selectedStatus;
      const url = `/api/admin/owner-requests${status ? `?status=${status}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch owner promotion requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/promote-owner/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: userId }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Owner promoted successfully!');
        fetchRequests();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('Error promoting owner');
      console.error(err);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectionReason[userId] || 'Rejected by admin';
    try {
      const response = await fetch(`/api/admin/reject-owner-promotion/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (data.success) {
        alert('❌ Owner promotion request rejected');
        fetchRequests();
      } else {
        alert('Error rejecting request: ' + data.error);
      }
    } catch (err) {
      alert('Error rejecting request');
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          👤 Owner Promotion Requests
        </h1>
        <p className="text-gray-600">
          Manage requests from users wanting to become property owners
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSelectedStatus('pending')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            selectedStatus === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⏳ Pending ({requests.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            selectedStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 All
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No {selectedStatus} requests found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {request.userId.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 inline-block">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-600">📧 {request.userId.email}</p>
                  <p className="text-gray-600 mt-2">
                    🏠 Property: <span className="font-medium">{request.propertyTitle}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Requested: {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting):
                    </label>
                    <textarea
                      placeholder="E.g., Property verification incomplete..."
                      value={rejectionReason[request.userId._id] || ''}
                      onChange={(e) =>
                        setRejectionReason({
                          ...rejectionReason,
                          [request.userId._id]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.userId._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      ✅ Approve & Promote
                    </button>
                    <button
                      onClick={() => handleReject(request.userId._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )}

              {request.status === 'rejected' && request.reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Rejection Reason:</strong> {request.reason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

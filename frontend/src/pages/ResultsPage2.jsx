import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, Search, Filter } from 'lucide-react';

export default function ResultsLayout() {
  const [expandedControl, setExpandedControl] = useState(false);
  const [expandedStress, setExpandedStress] = useState(false);
  const [controlSearchQuery, setControlSearchQuery] = useState('');
  const [stressSearchQuery, setStressSearchQuery] = useState('');
  
  // Simulated data for control and stress mice - expanded to 10 mice
  const controlMice = [
    { id: 'C001', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    { id: 'C002', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] }, 
    // { id: 'C003', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C004', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C005', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C006', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C007', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C008', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C009', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'C010', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] }
  ];
  
  const stressMice = [
    { id: 'S001', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    { id: 'S002', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    { id: 'S003', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    { id: 'S004', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    { id: 'S005', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'S006', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'S007', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'S008', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'S009', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] },
    // { id: 'S010', files: ['results.csv', 'results_raw.csv', 'results_norm.csv'] }
  ];

  // Filter mice based on search query
  const filteredControlMice = controlSearchQuery 
    ? controlMice.filter(mouse => mouse.id.toLowerCase().includes(controlSearchQuery.toLowerCase()))
    : controlMice;
    
  const filteredStressMice = stressSearchQuery
    ? stressMice.filter(mouse => mouse.id.toLowerCase().includes(stressSearchQuery.toLowerCase()))
    : stressMice;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md max-w-screen-2xl mx-auto">
        <h1 className='big-title'>Brain Atlas Platform</h1>
        <h2 className="text-2xl font-bold mb-4">Results Overview</h2>
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Control Heatmap and Data */}
        <div>
          {/* Control Heatmap */}
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">Control Group Heatmap</h3>
            <div className="h-120 flex items-center justify-center overflow-hidden">
              <img 
                src="/control_heatmap1.png" 
                alt="Control Group Heatmap Visualization" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Control Group Files */}
          <div className="bg-white rounded shadow">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedControl(!expandedControl)}
            >
              <h3 className="font-bold text-blue-500">Control Group Data</h3>
              {expandedControl ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedControl && (
              <div className="p-4 border-t">
                {/* Search and filters */}
                {/* <div className="mb-4 flex items-center">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search mice..."
                      className="w-full p-2 pl-8 border rounded text-sm"
                      value={controlSearchQuery}
                      onChange={(e) => setControlSearchQuery(e.target.value)}
                    />
                    <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                  </div>
                  <button className="ml-2 p-2 border rounded">
                    <Filter size={16} />
                  </button>
                </div> */}
                
                {/* List with max height and scrolling */}
                <div className="max-h-96 overflow-y-auto pr-2">
                  {filteredControlMice.map(mouse => (
                    <div key={mouse.id} className="mb-3 pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Mouse {mouse.id}</h4>
                        <button className="text-blue-600 text-xs">View all files</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {mouse.files.map(file => (
                          <div key={file} className="flex items-center text-sm bg-gray-50 p-1 rounded">
                            <FileText size={14} className="mr-1 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{file}</span>
                            <button className="ml-1 text-blue-600 flex-shrink-0">
                              <Download size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredControlMice.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No mice match your search
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    Download All Control Files
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stress Heatmap and Data */}
        <div>
          {/* Stress Heatmap */}
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-bold mb-2">Stress Group Heatmap</h3>
            <div className="h-120 flex items-center justify-center overflow-hidden">
              <img 
                src="/stress_heatmap1.png" 
                alt="Stress Group Heatmap Visualization" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Stress Group Files */}
          <div className="bg-white rounded shadow">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedStress(!expandedStress)}
            >
              <h3 className="font-bold text-red-500">Stress Group Data</h3>
              {expandedStress ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {expandedStress && (
              <div className="p-4 border-t">
                {/* Search and filters */}
                {/* <div className="mb-4 flex items-center">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search mice..."
                      className="w-full p-2 pl-8 border rounded text-sm"
                      value={stressSearchQuery}
                      onChange={(e) => setStressSearchQuery(e.target.value)}
                    />
                    <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                  </div>
                  <button className="ml-2 p-2 border rounded">
                    <Filter size={16} />
                  </button>
                </div> */}
                
                {/* List with max height and scrolling */}
                <div className="max-h-96 overflow-y-auto pr-2">
                  {filteredStressMice.map(mouse => (
                    <div key={mouse.id} className="mb-3 pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Mouse {mouse.id}</h4>
                        <button className="text-blue-600 text-xs">View all files</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {mouse.files.map(file => (
                          <div key={file} className="flex items-center text-sm bg-gray-50 p-1 rounded">
                            <FileText size={14} className="mr-1 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{file}</span>
                            <button className="ml-1 text-blue-600 flex-shrink-0">
                              <Download size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredStressMice.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No mice match your search
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    Download All Stress Files
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Histogram */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">Data Distribution Histogram</h3>
        <div className="h-98 flex items-center justify-center overflow-hidden">
              <img 
                src="/histogram.png" 
                alt="Stress Group Heatmap Visualization" 
                className="w-full h-full object-contain"
              />
            </div>
      </div>
    </div>
  );
}
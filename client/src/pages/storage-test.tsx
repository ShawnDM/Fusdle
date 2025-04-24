import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getGameData, exportGameData, importGameData, updateGameData } from '@/lib/indexed-db';
import { useToast } from '@/hooks/use-toast';

export default function StorageTest() {
  const [indexedDbData, setIndexedDbData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [exportedData, setExportedData] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get IndexedDB data
        const data = await getGameData();
        setIndexedDbData(data);
        
        // Get localStorage data
        const storageData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                try {
                  // Try to parse JSON
                  storageData[key] = JSON.parse(value);
                } catch {
                  // If not JSON, store as string
                  storageData[key] = value;
                }
              }
            } catch (e) {
              console.error(`Error reading localStorage key ${key}:`, e);
              storageData[key] = '(error reading value)';
            }
          }
        }
        setLocalStorageData(storageData);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading storage data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load storage data',
          variant: 'destructive'
        });
      }
    };
    
    loadData();
  }, [toast]);

  // Export data to JSON
  const handleExport = async () => {
    try {
      const jsonData = await exportGameData();
      setExportedData(jsonData);
      toast({
        title: 'Data Exported',
        description: 'Game data has been exported to JSON',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export game data',
        variant: 'destructive'
      });
    }
  };

  // Import data from JSON
  const handleImport = async () => {
    try {
      if (!exportedData) {
        toast({
          title: 'Import Failed',
          description: 'No data to import',
          variant: 'destructive'
        });
        return;
      }
      
      await importGameData(exportedData);
      
      // Refresh the data display
      const data = await getGameData();
      setIndexedDbData(data);
      
      toast({
        title: 'Data Imported',
        description: 'Game data has been imported successfully',
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Could not import game data',
        variant: 'destructive'
      });
    }
  };

  // Reset streak for testing
  const handleResetStreaks = async () => {
    try {
      await updateGameData({
        streak: 0,
        flawlessStreak: 0
      });
      
      // Refresh the data display
      const data = await getGameData();
      setIndexedDbData(data);
      
      toast({
        title: 'Streaks Reset',
        description: 'Streak data has been reset to zero',
      });
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: 'Reset Failed',
        description: 'Could not reset streak data',
        variant: 'destructive'
      });
    }
  };

  if (!dataLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg">Loading storage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Storage Debug Tools</CardTitle>
          <CardDescription>
            Tools to test and debug the IndexedDB storage implementation
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="indexeddb">
            <TabsList className="mb-4">
              <TabsTrigger value="indexeddb">IndexedDB</TabsTrigger>
              <TabsTrigger value="localstorage">localStorage</TabsTrigger>
              <TabsTrigger value="export">Export/Import</TabsTrigger>
            </TabsList>
            
            <TabsContent value="indexeddb" className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">Database Contents</Badge>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(indexedDbData, null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetStreaks}>
                  Reset Streaks
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="localstorage" className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">localStorage Contents</Badge>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(localStorageData, null, 2)}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <Button onClick={handleExport}>Export Data</Button>
                <Button variant="outline" onClick={handleImport}>Import Data</Button>
              </div>
              
              <div>
                <Badge variant="secondary" className="mb-2">JSON Data</Badge>
                <textarea 
                  className="w-full h-[200px] p-2 text-xs font-mono border rounded-md" 
                  value={exportedData}
                  onChange={(e) => setExportedData(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            This page is for debugging purposes only
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
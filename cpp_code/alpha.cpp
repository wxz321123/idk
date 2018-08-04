#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <vector>
#include <stdlib.h>
#include <string.h>
#define len 256
using namespace std;

char *concat(const char *s1, const char *s2)
{
    char *result = (char *)malloc(strlen(s1) + strlen(s2) + 1); // +1 for the null-terminator
    // in real code you would check for errors in malloc here
    strcpy(result, s1);
    strcat(result, s2);
    return result;
}
int main()
{
    /* code */
    FILE *fpunt;
    char path[] = "./formatted_source/";
    char fileAppResources[] = "scheduling_preliminary_a_app_resources_20180606.txt";
    char fileDeploy[] = "scheduling_preliminary_a_instance_deploy_20180606.txt";
    char fileServer[] = "scheduling_preliminary_a_machine_resources_20180606.txt";
    char fileInterference[] = "scheduling_preliminary_a_app_interference_20180606.txt";
    vector<vector<int>> risorseRichiesteApp, listaServer, inPosizionamentoIstanze, listaInterferenze;
    fpunt = fopen(concat(path, fileInterference), "r");
    while (fscanf(fpunt, "%s", str) != EOF)
    {
        for (puntChar = str; *puntChar != '\0'; puntChar++)
        {
        }
    }
    return 0;
}

#include <vector>
#include <string.h>
#define len 256
using namespace std;
int main()
{
    char str[len], *puntChar;
    char filePathIn[len] = "./source/";
    char filePathOut[len] = "./formatted_source/";
    char fileName[] = "scheduling_preliminary_a_app_resources_20180606.txt";
    FILE *filePuntIn = fopen(strcat(filePathIn, fileName), "r");
    FILE *filePuntOut = fopen(strcat(filePathOut, fileName), "w");
    if (filePuntIn)
    {
        while (fscanf(filePuntIn, "%s", str) != EOF)
        {
            for (puntChar = str; *puntChar != '\0'; puntChar++)
            {
                if (*puntChar == ',' || *puntChar == '|')
                {
                    fprintf(filePuntOut, " ");
                }
                else if (*puntChar == '.')
                {
                    fprintf(filePuntOut, ".");
                }
                else
                {
                    if (*puntChar >= '0' && *puntChar <= '9')
                    {
                        fprintf(filePuntOut, "%c", *puntChar);
                    }
                }
            }
            fprintf(filePuntOut, "\n");
        }
        fclose(filePuntOut);
        fclose(filePuntIn);
        printf("Done\n");
    }
}